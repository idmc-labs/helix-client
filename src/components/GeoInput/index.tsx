import React, { useState, useMemo, useCallback } from 'react';
import { gql, useQuery, useLazyQuery } from '@apollo/client';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import combine from '@turf/combine';
import featureCollection from 'turf-featurecollection';
import produce from 'immer';
import { v4 as uuidv4 } from 'uuid';
import {
    IoMdClose,
    IoMdAdd,
    IoMdSearch,
} from 'react-icons/io';
import Map, {
    MapContainer,
    MapBounds,
    MapLayer,
    MapSource,
} from '@togglecorp/re-map';
import {
    TextInput,
    RawButton,
    Button,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined } from '@togglecorp/fujs';

import { GeoLocationFormProps } from '#components/EntryForm/types';
import Loading from '#components/Loading';
import {
    LookupQuery,
    LookupQueryVariables,
    ReverseLookupQuery,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { removeNull } from '#utils/schema';
import { PartialForm } from '#types';

import styles from './styles.css';

type GeoLocation = PartialForm<GeoLocationFormProps>;

type LookupData = NonNullable<NonNullable<LookupQuery['lookup']>['results']>[0]

type Bounds = [number, number, number, number];

interface MovedPoint {
    id: string | number | undefined;
    point: [number, number];
}

interface Country {
    iso2?: string | null;
    name: string;
    boundingBox?: number[] | null;
}

interface Dragging {
    id: string | number | undefined;
    layerName: string;
    // NOTE: may not need to use these two below
    sourceName: string;
}

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
              country
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
              country
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
}>;

const lightStyle = 'mapbox://styles/mapbox/light-v10';

const locationsSourceOptions: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const pointCirclePaint: mapboxgl.CirclePaint = {
    'circle-color': ['case', ['==', ['get', 'identifier'], 'SOURCE'], 'blue', 'red'],
    'circle-radius': 12,
    'circle-opacity': 0.5,
    'circle-pitch-alignment': 'map',
};
const pointLabelPaint: mapboxgl.SymbolPaint = {
    'text-color': '#6b6b6b',
    'text-halo-color': 'rgba(255, 255, 255, 0.7)',
    'text-halo-width': 2,
};
const pointLabelLayout: mapboxgl.SymbolLayout = {
    'text-field': ['get', 'name'],
    'text-size': 14,
    'text-justify': 'center',
    'text-anchor': 'center',
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

function convertToGeo(value: GeoLocation[] | null | undefined): LocationGeoJson {
    const features = value
        ?.map((item) => {
            if (!item.osmId || !item.lon || !item.lat) {
                return undefined;
            }
            return {
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
            };
        })
        .filter(isDefined);
    const geo = {
        type: 'FeatureCollection' as const,
        features: features ?? [],
    };
    return geo;
}
function convertToGeoLocation(item: LookupData) {
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
        identifier: 'SOURCE',
        // FIXME: this is not type-safe
        accuracy: 'POINT',
        // FIXME: do we set this?
        reportedName: properties.name,
    };
    return newValue;
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

    const geo = useDebouncedValue(
        value,
        undefined,
        convertToGeo,
    );

    const geoWithTempLoc = useMemo(
        () => {
            if (!tempLocation) {
                return geo;
            }
            const newGeo = convertToGeo([tempLocation]);
            return {
                ...geo,
                features: [
                    ...geo.features,
                    ...newGeo.features,
                ],
            };
        },
        [tempLocation, geo],
    );

    const defaultBounds = country?.boundingBox as (Bounds | null | undefined) ?? undefined;
    const iso2 = country?.iso2;

    const debouncedValue = useDebouncedValue(search);

    const variables = useMemo(
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
        variables,
        skip: !variables,
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
                            reportedName: properties.name,
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
            const newLocationsGeoJson = produce(
                geo,
                (safeGeoJson) => {
                    const index = safeGeoJson.features.findIndex(
                        (item) => item.id && +item.id === feature.id,
                    );
                    if (index !== -1) {
                        // eslint-disable-next-line no-param-reassign
                        safeGeoJson.features[index].geometry.coordinates = [
                            lngLat.lng,
                            lngLat.lat,
                        ];
                    }
                },
            );
            const source = map.getSource(feature.sourceName);
            if (source.type === 'geojson') {
                source.setData(newLocationsGeoJson);
            }
        },
        [geo],
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
            const allBounds = geo.features
                .map((item) => item.bbox)
                .filter(isDefined);
            if (allBounds.length > 0) {
                const boundsFeatures = allBounds.map((b) => bboxPolygon(b));
                const boundsFeatureCollection = featureCollection(boundsFeatures);
                const combinedPolygons = combine(boundsFeatureCollection);
                const maxBounds = bbox(combinedPolygons);
                setBounds(maxBounds as Bounds);
            }
        },
        [geo],
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
                <MapBounds
                    bounds={bounds ?? defaultBounds}
                    padding={60}
                />
                <MapSource
                    sourceKey="locations"
                    sourceOptions={locationsSourceOptions}
                    geoJson={geoWithTempLoc}
                >
                    <MapLayer
                        onDrag={inputDisabled || readOnly ? undefined : handleDrag}
                        onDragEnd={inputDisabled || readOnly ? undefined : handleDragEnd}
                        layerKey="locations-circle"
                        layerOptions={{
                            type: 'circle',
                            paint: pointCirclePaint,
                        }}
                    />
                    <MapLayer
                        layerKey="locations-text"
                        layerOptions={{
                            type: 'symbol',
                            paint: pointLabelPaint,
                            layout: pointLabelLayout,
                        }}
                    />
                </MapSource>
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
                            disabled={inputDisabled || readOnly || !iso2}
                        />
                    </div>
                    <div className={styles.result}>
                        {data?.lookup?.results?.map((item) => (
                            <LookupItem
                                key={item.id}
                                item={item}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleClick}
                                disabled={disabled}
                            />
                        ))}
                        {loading && <Loading /> }
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeoInput;
