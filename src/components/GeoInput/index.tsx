import React, { useState, useMemo, useCallback } from 'react';
import { gql, useQuery, useLazyQuery } from '@apollo/client';
import bearing from '@turf/bearing';
import { removeNull } from '@togglecorp/toggle-form';
import produce from 'immer';
import { v4 as uuidv4 } from 'uuid';
import {
    IoMdClose,
    IoMdAdd,
    IoMdSearch,
} from 'react-icons/io';
import Map, {
    MapTooltip,
    MapContainer,
    MapBounds,
    MapLayer,
    MapSource,
    MapImage,
    getLayerName,
} from '@togglecorp/re-map';
import {
    TextInput,
    RawButton,
    Button,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined, isTruthyString } from '@togglecorp/fujs';
import { mergeBbox } from '#utils/common';

import { GeoLocationFormProps } from '#views/Entry/EntryForm/types';
import Loading from '#components/Loading';
import {
    LookupQuery,
    LookupQueryVariables,
    ReverseLookupQuery,
    GlobalLookupQuery,
    GlobalLookupQueryVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { PartialForm, MakeRequired } from '#types';

import image from './arrow.png';

import styles from './styles.css';

type GeoLocation = PartialForm<GeoLocationFormProps>;

type LookupData = NonNullable<NonNullable<LookupQuery['lookup']>['results']>[0]

type Bounds = [number, number, number, number];

interface HoveredRegion {
    feature: mapboxgl.MapboxGeoJSONFeature;
    lngLat: mapboxgl.LngLatLike;
}

interface MovedPoint {
    id: string | number | undefined;
    point: GeoJSON.Position;
}

interface Country {
    iso2?: string | null;
    idmcShortName: string;
    boundingBox?: number[] | null;
    geojsonUrl?: string;
}

interface Dragging {
    id: string | number | undefined;
    layerName: string;
    // NOTE: may not need to use these two below
    sourceName: string;
}

const GLOBAL_LOOKUP = gql`
    query globalLookup($name: String!) {
        globalLookup(name: $name) @rest(type: "OsmNames", path: "/q/:name") {
            count
            nextIndex
            startIndex
            totalResults
            results {
              wikipedia
              rank
              country
              street
              wikidata
              country_code
              osm_id
              housenumbers
              id
              city
              display_name
              lon
              state
              boundingbox
              type
              importance
              lat
              class
              name
              name_suffix
              osm_type
              place_rank
              alternative_names
            }
        }
    }
`;

const LOOKUP = gql`
    query Lookup($name: String!, $country: String!) {
        lookup(name: $name, country: $country) @rest(type: "OsmNames", path: "/:country/q/:name") {
            count
            nextIndex
            startIndex
            totalResults
            results {
              wikipedia
              rank
              country
              street
              wikidata
              country_code
              osm_id
              housenumbers
              id
              city
              display_name
              lon
              state
              boundingbox
              type
              importance
              lat
              class
              name
              name_suffix
              osm_type
              place_rank
              alternative_names
            }
        }
    }
`;

const REVERSE_LOOKUP = gql`
    query ReverseLookup($lat: Float!, $lng: Float!) {
        reverseLookup(lat: $lat, lng: $lng) @rest(type: "OsmNames", path: "/r/:lng/:lat") {
            count
            nextIndex
            startIndex
            totalResults
            results {
              wikipedia
              rank
              country
              street
              wikidata
              country_code
              osm_id
              housenumbers
              id
              city
              display_name
              lon
              state
              boundingbox
              type
              importance
              lat
              class
              name
              name_suffix
              osm_type
              place_rank
              alternative_names
            }
        }
    }
`;

type LocationGeoJson = GeoJSON.FeatureCollection<GeoJSON.Point, {
    identifier: string | undefined,
    name: string | undefined,
    transient?: boolean;
}>;
type LocationLineGeoJson = GeoJSON.FeatureCollection<GeoJSON.LineString>;

const lightStyle = 'mapbox://styles/mapbox/light-v10';

const arrowImageOptions = {
    sdf: true,
};

const tooltipOptions: mapboxgl.PopupOptions = {
    closeOnClick: false,
    closeButton: false,
    offset: 8,
    maxWidth: '480px',
};

const sourceOption: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const sourceColor = '#e84d0e';
const destinationColor = '#e8a90e';
const pointRadius = 12;
const arrowOffet = 14;

const countryFillPaint: mapboxgl.FillPaint = {
    'fill-color': '#354052', // empty color
    'fill-opacity': 0.2,
};

const countryLinePaint: mapboxgl.LinePaint = {
    'line-color': '#ffffff',
    'line-width': 1,
};

const pointCirclePaint: mapboxgl.CirclePaint = {
    'circle-color': [
        'case',
        ['==', ['get', 'identifier'], 'ORIGIN'],
        sourceColor,
        destinationColor,
    ],
    'circle-radius': pointRadius,
    'circle-opacity': ['case', ['get', 'transient'], 0.5, 1],
    'circle-pitch-alignment': 'map',
};

const linePaint: mapboxgl.LinePaint = {
    'line-color': sourceColor,
    'line-opacity': 1,
    'line-width': 2,
};
const lineLayout: mapboxgl.LineLayout = {
    visibility: 'visible',
    'line-join': 'round',
    'line-cap': 'round',
};
const hiddenLayout: mapboxgl.LineLayout = {
    visibility: 'none',
};

const arrowPaint: mapboxgl.SymbolPaint = {
    'icon-color': sourceColor,
};
const arrowLayout: mapboxgl.SymbolLayout = {
    visibility: 'visible',
    'icon-image': 'equilateral-arrow-icon',
    'icon-size': 0.8,
    'icon-rotate': {
        type: 'identity',
        property: 'bearing',
    },
    'icon-offset': [0, arrowOffet],
    'icon-anchor': 'top',
    'icon-rotation-alignment': 'map',
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
};

// TODO: set fit to country
// TODO: set fit to current selections
// TODO: show on hover
// TODO: show migration lines
// TODO: set information of selected points
// TODO: disabled and read-only mode
interface LookupItemProps {
    item: LookupData;
    onMouseEnter: (item: LookupData) => void;
    onMouseLeave?: () => void;
    onClick: (item: LookupData) => void;
    disabled?: boolean;
}

function LookupItem(props: LookupItemProps) {
    const {
        item,
        onMouseLeave,
        onMouseEnter,
        onClick,
        disabled,
    } = props;

    const handleMouseEnter = useCallback(
        () => {
            onMouseEnter(item);
        },
        [item, onMouseEnter],
    );
    const handleClick = useCallback(
        () => {
            onClick(item);
        },
        [item, onClick],
    );

    return (
        <RawButton
            name={item.id}
            className={styles.item}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={handleClick}
            disabled={disabled}
        >
            <div>
                {item.name}
            </div>
            <div className={styles.description}>
                {item.display_name}
            </div>
        </RawButton>
    );
}

export interface GeoInputProps<T extends string> {
    value: GeoLocation[] | null | undefined;
    name: T;
    onChange: (value: GeoLocation[], name: T) => void;
    country?: Country;
    className?: string,
    disabled?: boolean;
    readOnly?: boolean;
}

const emptyList: unknown[] = [];

function link<T, K>(foo: T[], bar: K[]): [T, K][] {
    if (foo.length === 0 || bar.length === 0) {
        return [];
    }
    const [first, ...rest] = foo;
    const zip = bar.map((item): [T, K] => [first, item]);
    return [...zip, ...link(rest, bar)];
}

type GoodGeoLocation = MakeRequired<GeoLocation, 'osmId' | 'lon' | 'lat'>;
function isValidGeoLocation(value: GeoLocation): value is GoodGeoLocation {
    return isTruthyString(value.osmId) && isDefined(value.lon) && isDefined(value.lat);
}

function convertToGeoLocation(item: LookupData): GeoLocation {
    const properties = removeNull(item);
    const newValue: GeoLocation = {
        uuid: uuidv4(),
        wikipedia: properties.wikipedia,
        rank: properties.rank,
        country: properties.country,
        street: properties.street,
        wikiData: properties.wikidata,
        countryCode: properties.country_code,
        osmId: properties.osm_id,
        houseNumbers: properties.housenumbers,
        city: properties.city,
        displayName: properties.display_name,
        lon: properties.lon,
        state: properties.state,
        boundingBox: properties.boundingbox,
        type: properties.type,
        importance: properties.importance,
        lat: properties.lat,
        className: properties.class,
        name: properties.name,
        nameSuffix: properties.name_suffix,
        osmType: properties.osm_type,
        placeRank: properties.place_rank,
        alternativeNames: properties.alternative_names,

        moved: false,
        // FIXME: this is not type-safe
        identifier: 'ORIGIN',
        // FIXME: this is not type-safe
        accuracy: 'POINT',
    };
    return newValue;
}

function convertToGeoPoints(value: GeoLocation[] | null | undefined): LocationGeoJson {
    const features = value
        ?.filter(isValidGeoLocation)
        ?.map((item) => ({
            id: +item.osmId,
            type: 'Feature' as const,
            bbox: item.boundingBox as (Bounds | undefined),
            properties: {
                identifier: item.identifier,
                name: item.name,
            },
            geometry: {
                type: 'Point' as const,
                coordinates: [item.lon, item.lat],
            },
        }));

    const geo = {
        type: 'FeatureCollection' as const,
        features: features ?? [],
    };
    return geo;
}

function convertToGeoLines(value: GeoLocation[] | null | undefined): LocationLineGeoJson {
    const validValues = value?.filter(isValidGeoLocation);
    const relations = link(
        validValues?.filter((item) => item.identifier === 'ORIGIN') ?? [],
        validValues?.filter((item) => item.identifier === 'DESTINATION') ?? [],
    );
    const geo = {
        type: 'FeatureCollection' as const,
        features: relations.map(([source, dest]) => ({
            id: undefined,
            type: 'Feature' as const,
            geometry: {
                type: 'LineString' as const,
                coordinates: [
                    [source.lon, source.lat],
                    [dest.lon, dest.lat],
                ],
            },
            properties: {},
        })),
    };
    return geo;
}

function convertToGeoArrows(locations: LocationLineGeoJson) {
    const geo = {
        type: 'FeatureCollection' as const,
        features: locations.features.map((feature) => {
            const rotation = bearing(
                feature.geometry.coordinates[0],
                feature.geometry.coordinates[1],
            );
            return {
                id: undefined,
                type: 'Feature' as const,
                geometry: {
                    type: 'Point' as const,
                    coordinates: feature.geometry.coordinates[1],
                },
                properties: {
                    bearing: rotation,
                },
            };
        }),
    };
    return geo;
}

function GeoInput<T extends string>(props: GeoInputProps<T>) {
    const {
        value: valueFromProps,
        name,
        onChange,
        className,
        country,
        readOnly,
        disabled,
    } = props;

    const value = valueFromProps ?? (emptyList as GeoLocation[]);

    const [searchShown, setSearchShown] = useState(false);
    const [search, setSearch] = useState<string | undefined>();

    const [bounds, setBounds] = useState<Bounds | undefined>();
    const [tempLocation, setTempLocation] = useState<GeoLocation | undefined>();
    const [movedPoint, setMovedPoint] = useState<MovedPoint | undefined>();

    // icon ready
    const [iconReady, setIconReady] = useState(false);

    const [
        hoveredRegionProperties,
        setHoveredRegionProperties,
    ] = React.useState<HoveredRegion | undefined>();

    const geoPoints = useMemo(
        () => convertToGeoPoints(value),
        [value],
    );

    const geoPointsWithTempPoint = useMemo(
        () => {
            if (!tempLocation) {
                return geoPoints;
            }
            const newGeo = convertToGeoPoints([tempLocation]);
            return {
                ...geoPoints,
                features: [
                    ...geoPoints.features,
                    ...newGeo.features,
                ],
            };
        },
        [tempLocation, geoPoints],
    );

    const geoLines = useMemo(
        () => convertToGeoLines(value),
        [value],
    );

    const geoArrows = useMemo(
        () => convertToGeoArrows(geoLines),
        [geoLines],
    );

    const defaultBounds = country?.boundingBox as (Bounds | null | undefined) ?? undefined;
    const iso2 = country?.iso2;

    const debouncedValue = useDebouncedValue(search);

    const globalLookupVariables = useMemo(
        (): GlobalLookupQueryVariables | undefined => (
            !debouncedValue
                ? undefined
                : { name: debouncedValue }
        ),
        [debouncedValue],
    );

    const lookupVariables = useMemo(
        (): LookupQueryVariables | undefined => (
            !iso2 || !debouncedValue
                ? undefined
                : { name: debouncedValue, country: iso2 }
        ),
        [debouncedValue, iso2],
    );

    const {
        data,
        loading,
    } = useQuery<LookupQuery>(LOOKUP, {
        variables: lookupVariables,
        skip: !lookupVariables,
    });

    const {
        data: globalLookupData,
        loading: globalLoading,
    } = useQuery<GlobalLookupQuery>(GLOBAL_LOOKUP, {
        variables: globalLookupVariables,
    });

    const [
        getReverseLookup,
        { loading: loadingReverse },
    ] = useLazyQuery<ReverseLookupQuery>(REVERSE_LOOKUP, {
        onCompleted: (response) => {
            if (!movedPoint) {
                return;
            }

            const properties = removeNull(response?.reverseLookup?.results?.[0]);
            if (!properties) {
                setMovedPoint(undefined);
                return;
            }
            const newValue = produce(
                value,
                (safeValue) => {
                    const index = safeValue.findIndex(
                        (item) => item.osmId && +item.osmId === movedPoint.id,
                    );
                    if (index !== -1) {
                        // eslint-disable-next-line no-param-reassign
                        safeValue[index] = {
                            ...safeValue[index],
                            wikipedia: properties.wikipedia,
                            rank: properties.rank,
                            country: properties.country,
                            street: properties.street,
                            wikiData: properties.wikidata,
                            countryCode: properties.country_code,
                            osmId: properties.osm_id,
                            houseNumbers: properties.housenumbers,
                            city: properties.city,
                            displayName: properties.display_name,
                            lon: movedPoint.point[0],
                            lat: movedPoint.point[1],
                            // FIXME: also save these values as well
                            // lon: properties.lon,
                            // lat: properties.lat,
                            state: properties.state,
                            boundingBox: properties.boundingbox,
                            type: properties.type,
                            importance: properties.importance,
                            className: properties.class,
                            name: properties.name,
                            nameSuffix: properties.name_suffix,
                            osmType: properties.osm_type,
                            placeRank: properties.place_rank,
                            alternativeNames: properties.alternative_names,

                            moved: true,
                        };
                    }
                },
            );
            onChange(newValue, name);

            setMovedPoint(undefined);
        },
        onError: () => {
            console.error('Could not move point');
            setMovedPoint(undefined);
        },
    });

    const handleDrag = useCallback(
        (
            feature: Dragging,
            lngLat: mapboxgl.LngLat,
            _: unknown,
            map: mapboxgl.Map,
        ) => {
            const transientPointIndex = geoPoints.features.findIndex(
                (item) => item.id && +item.id === 0,
            );

            let locations: LocationGeoJson | undefined;
            if (transientPointIndex <= -1) {
                // create a new transient point
                const originalPoint = geoPoints.features.find(
                    (item) => item.id && +item.id === feature.id,
                );
                if (!originalPoint) {
                    locations = undefined;
                } else {
                    const transientPoint = produce(
                        originalPoint,
                        (safeOriginalPoint) => {
                            if (!safeOriginalPoint) {
                                return;
                            }
                            // eslint-disable-next-line no-param-reassign
                            safeOriginalPoint.id = 0;
                            // eslint-disable-next-line no-param-reassign
                            safeOriginalPoint.geometry.coordinates = [
                                lngLat.lng,
                                lngLat.lat,
                            ];
                            // eslint-disable-next-line no-param-reassign
                            safeOriginalPoint.properties.transient = true;
                        },
                    );
                    locations = produce(geoPoints, (safeLocations) => {
                        // NOTE: unshift instead of push because find will
                        // always check from start. (optimization)
                        safeLocations.features.unshift(transientPoint);
                    });
                }
            } else {
                locations = produce(geoPoints, (safeLocations) => {
                    // eslint-disable-next-line no-param-reassign
                    safeLocations.features[transientPointIndex].geometry.coordinates = [
                        lngLat.lng,
                        lngLat.lat,
                    ];
                });
            }

            if (!locations) {
                return;
            }

            const source = map.getSource(feature.sourceName);
            if (source.type === 'geojson') {
                source.setData(locations);
            }
        },
        [geoPoints],
    );

    const handleDragEnd = useCallback(
        (
            feature: Dragging,
            lngLat: mapboxgl.LngLat,
        ) => {
            setMovedPoint({
                id: feature.id,
                point: [lngLat.lng, lngLat.lat],
            });

            getReverseLookup({
                variables: {
                    lng: lngLat.lng,
                    lat: lngLat.lat,
                },
            });
        },
        [getReverseLookup],
    );

    const handleMouseEnter = useCallback(
        (item: LookupData) => {
            const newValue = convertToGeoLocation(item);
            setTempLocation(newValue);
            setBounds(item.boundingbox as Bounds);
        },
        [],
    );

    const handleSetCountryBounds = useCallback(
        () => {
            if (defaultBounds) {
                // NOTE: making a new reference so that it will always set
                // bounds
                setBounds([...defaultBounds]);
            }
        },
        [defaultBounds],
    );

    const handleSetConvexBounds = useCallback(
        () => {
            const allBounds = geoPoints.features
                .map((item) => item.bbox)
                .filter(isDefined);
            if (allBounds.length > 0) {
                const maxBounds = mergeBbox(allBounds);
                setBounds(maxBounds);
            }
        },
        [geoPoints],
    );

    const handleMouseLeave = useCallback(
        () => {
            setTempLocation(undefined);
        },
        [],
    );

    const handleClick = useCallback(
        (item: LookupData) => {
            const newValue = convertToGeoLocation(item);
            onChange([...value, newValue], name);
            setSearch(undefined);
            setSearchShown(false);
            setTempLocation(undefined);
        },
        [onChange, value, name],
    );

    const handleSearchShownToggle = useCallback(
        () => {
            setSearchShown((item) => !item);
        },
        [],
    );

    const handleIconLoad = useCallback(
        () => {
            setIconReady(true);
        },
        [],
    );

    const handleMapRegionMouseEnter = React.useCallback(
        (feature: mapboxgl.MapboxGeoJSONFeature, lngLat: mapboxgl.LngLat) => {
            setHoveredRegionProperties({
                feature,
                lngLat,
            });
        },
        [setHoveredRegionProperties],
    );

    const handleMapRegionMouseLeave = React.useCallback(
        () => {
            setHoveredRegionProperties(undefined);
        },
        [setHoveredRegionProperties],
    );

    const inputDisabled = loadingReverse || disabled;

    return (
        <div className={_cs(styles.comp, className)}>
            <Map
                mapStyle={lightStyle}
                mapOptions={{
                    logoPosition: 'bottom-left',
                }}
                scaleControlShown
                navControlShown
                scaleControlPosition="bottom-right"
                navControlPosition="top-left"
            >
                <div className={styles.container}>
                    <div className={styles.floating}>
                        {!readOnly && (
                            <Button
                                name={undefined}
                                onClick={handleSearchShownToggle}
                                icons={searchShown ? <IoMdClose /> : <IoMdAdd />}
                                disabled={inputDisabled || readOnly}
                            >
                                {searchShown ? 'Close' : 'Add location'}
                            </Button>
                        )}
                        {defaultBounds && (
                            <Button
                                name={undefined}
                                onClick={handleSetCountryBounds}
                            >
                                Fit to country
                            </Button>
                        )}
                        {value.length > 0 && (
                            <Button
                                name={undefined}
                                onClick={handleSetConvexBounds}
                            >
                                Fit to locations
                            </Button>
                        )}
                    </div>
                    <MapContainer className={styles.mapContainer} />
                </div>
                <MapImage
                    name="equilateral-arrow-icon"
                    url={image}
                    imageOptions={arrowImageOptions}
                    onLoad={handleIconLoad}
                />
                <MapBounds
                    bounds={bounds ?? defaultBounds}
                    padding={60}
                />
                <MapSource
                    sourceKey="lines"
                    sourceOptions={sourceOption}
                    geoJson={geoLines}
                >
                    <MapLayer
                        layerKey="line"
                        layerOptions={{
                            type: 'line',
                            layout: lineLayout,
                            paint: linePaint,
                        }}
                    />
                </MapSource>
                <MapSource
                    sourceKey="arrows"
                    sourceOptions={sourceOption}
                    geoJson={geoArrows}
                >
                    <MapLayer
                        layerKey="arrows-icon"
                        layerOptions={{
                            type: 'symbol',
                            paint: arrowPaint,
                            layout: iconReady ? arrowLayout : hiddenLayout,
                        }}
                    />
                </MapSource>
                <MapSource
                    sourceKey="points"
                    sourceOptions={sourceOption}
                    geoJson={geoPointsWithTempPoint}
                >
                    <MapLayer
                        onDrag={inputDisabled || readOnly ? undefined : handleDrag}
                        onDragEnd={inputDisabled || readOnly ? undefined : handleDragEnd}
                        layerKey="points-circle"
                        layerOptions={{
                            type: 'circle',
                            paint: pointCirclePaint,
                        }}
                        onMouseEnter={handleMapRegionMouseEnter}
                        onMouseLeave={handleMapRegionMouseLeave}
                    />
                    {hoveredRegionProperties && hoveredRegionProperties.lngLat && (
                        <MapTooltip
                            coordinates={hoveredRegionProperties.lngLat}
                            tooltipOptions={tooltipOptions}
                            trackPointer
                        >
                            {hoveredRegionProperties?.feature?.properties?.name}
                        </MapTooltip>
                    )}
                </MapSource>
                {country?.geojsonUrl && (
                    <MapSource
                        sourceKey="country"
                        sourceOptions={{
                            type: 'geojson',
                        }}
                        geoJson={country.geojsonUrl}
                    >
                        <MapLayer
                            layerKey="country-fill"
                            layerOptions={{
                                type: 'fill',
                                paint: countryFillPaint,
                            }}
                            beneath={getLayerName('lines', 'line')}
                        />
                        <MapLayer
                            layerKey="country-line"
                            layerOptions={{
                                type: 'line',
                                paint: countryLinePaint,
                            }}
                            beneath={getLayerName('lines', 'line')}
                        />
                    </MapSource>
                )}
            </Map>
            {!readOnly && searchShown && (
                <div className={styles.search}>
                    <div className={styles.filter}>
                        <TextInput
                            className={styles.input}
                            name="search"
                            value={search}
                            onChange={setSearch}
                            placeholder="Search to add location"
                            autoFocus
                            icons={(
                                <IoMdSearch />
                            )}
                            disabled={inputDisabled || readOnly}
                        />
                    </div>
                    <div className={styles.result}>
                        {iso2 && data?.lookup?.results?.map((item) => (
                            <LookupItem
                                key={item.id}
                                item={item}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleClick}
                                disabled={disabled}
                            />
                        ))}
                        {!iso2 && globalLookupData?.globalLookup?.results?.map((item) => (
                            <LookupItem
                                key={item.id}
                                item={item}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleClick}
                                disabled={disabled}
                            />
                        ))}
                        {globalLoading && <Loading />}
                        {loading && <Loading />}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeoInput;
