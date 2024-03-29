import React, { useState, useMemo, useCallback } from 'react';
import { gql, useQuery, useLazyQuery } from '@apollo/client';
import { removeNull } from '@togglecorp/toggle-form';
import produce from 'immer';
import { v4 as uuidv4 } from 'uuid';
import {
    IoCloseOutline,
    IoAddOutline,
    IoSearchOutline,
} from 'react-icons/io5';
import {
    MapTooltip,
    MapLayer,
    MapSource,
    MapImage,
} from '@togglecorp/re-map';
import {
    TextInput,
    RawButton,
    Button,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined, isTruthyString } from '@togglecorp/fujs';
import { mergeBbox } from '#utils/common';

import { GeoLocationFormProps } from '#components/forms/EntryForm/types';
import Loading from '#components/Loading';
import {
    LookupQuery,
    LookupQueryVariables,
    ReverseLookupQuery,
    GlobalLookupQuery,
    GlobalLookupQueryVariables,
    Identifier,
    Osm_Accuracy as OsmAccuracy,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { PartialForm, MakeRequired } from '#types';
import CountriesMap, { Bounds, Centers } from '#components/CountriesMap';

import image from './arrow.png';

import styles from './styles.css';

type GeoLocation = PartialForm<GeoLocationFormProps>;

type LookupData = NonNullable<NonNullable<LookupQuery['lookup']>['results']>[0]

interface HoveredRegion {
    feature: mapboxgl.MapboxGeoJSONFeature;
    lngLat: mapboxgl.LngLatLike;
}

interface MovedPoint {
    id: string | number | undefined;
    point: GeoJSON.Position;
}

interface Country {
    id: string;
    iso2?: string | null;
    idmcShortName: string;
    boundingBox?: number[] | null;
    geojsonUrl?: string | null;
}

interface Dragging {
    id: string | number | undefined;
    layerName: string;
    // NOTE: may not need to use these two below
    sourceName: string;
}

// NOTE: Any change done here on the list should also be done on the server
// NOTE: we remove these following iso2:
// - NC
// - PF
const supportedCountries = [
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
    'AU', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BM',
    'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ', 'CA', 'CD', 'CF',
    'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CY',
    'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER',
    'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE',
    'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GQ', 'GR', 'GS', 'GT', 'GW', 'GY',
    'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR',
    'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN',
    'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
    'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML',
    'MM', 'MN', 'MP', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
    'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA',
    'PE', 'PG', 'PH', 'PK', 'PL', 'PN', 'PS', 'PT', 'PW', 'PY', 'QA',
    'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI',
    'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SY', 'SZ', 'TA',
    'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR',
    'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC',
    'VE', 'VG', 'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'ZA', 'ZM', 'ZW',
];

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
const defaultColor = '#333333';
const pointRadius = 12;

const origin: Identifier = 'ORIGIN';
const destination: Identifier = 'DESTINATION';
const originAndDestination: Identifier = 'ORIGIN_AND_DESTINATION';

const pointCirclePaint: mapboxgl.CirclePaint = {
    'circle-color': [
        'case',
        ['==', ['get', 'identifier'], origin],
        sourceColor,
        ['==', ['get', 'identifier'], originAndDestination],
        sourceColor,
        ['==', ['get', 'identifier'], destination],
        destinationColor,
        defaultColor,
    ],
    'circle-radius': [
        'case',
        ['to-boolean', ['get', 'identifier']],
        pointRadius,
        pointRadius / 2,
    ],
    'circle-opacity': [
        'case',
        ['any', ['!', ['to-boolean', ['get', 'identifier']]], ['get', 'transient']],
        0.5,
        0.9,
    ],
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
    'symbol-placement': 'line-center',
    'icon-rotate': 90,
    'icon-rotation-alignment': 'map',
    'icon-ignore-placement': true,
    'icon-allow-overlap': true,
};

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

// The mapping is created from the information available here:
// https://github.com/OSMNames/OSMNames/blob/master/osmnames/prepare_data/set_place_ranks.sql
const mappings: {
    [key: string]: OsmAccuracy | undefined;
} = {
    continent: 'ADM0',

    country: 'ADM0',

    country_region: 'ADM1',
    state: 'ADM1',

    state_district: 'ADM2',
    county: 'ADM2',
    administrative: 'ADM2',

    town: 'ADM3',
    city: 'ADM3',
    district: 'ADM3',
    city_district: 'ADM3',
    village: 'ADM3',
    hamlet: 'ADM3',
    municipality: 'ADM3',
    suburb: 'ADM3',
};
const defaultAccuracy: OsmAccuracy = 'POINT';
function inferAccuracy(type: string | undefined | null): OsmAccuracy {
    if (!type) {
        return defaultAccuracy;
    }
    return mappings[type] || defaultAccuracy;
}

function convertToGeoLocation(item: LookupData, omitIdentifier?: boolean): GeoLocation {
    const properties = removeNull(item);
    const defaultIdentifier: Identifier = 'ORIGIN';

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
        identifier: omitIdentifier ? undefined : defaultIdentifier,
        accuracy: inferAccuracy(properties.type),
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
        validValues?.filter((item) => item.identifier === origin) ?? [],
        validValues?.filter((item) => item.identifier === destination) ?? [],
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

    const [center, setCenter] = useState<Centers | undefined>();
    const [bounds, setBounds] = useState<Bounds | undefined>();
    const [tempLocation, setTempLocation] = useState<GeoLocation | undefined>();
    const [movedPoint, setMovedPoint] = useState<MovedPoint | undefined>();

    // icon ready
    const [iconReady, setIconReady] = useState(false);

    const [
        hoveredRegionProperties,
        setHoveredRegionProperties,
    ] = useState<HoveredRegion | undefined>();

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

    const defaultBounds = country?.boundingBox as (Bounds | null | undefined) ?? undefined;
    const iso2 = country?.iso2;

    const isValidIso2 = useMemo(
        () => iso2 && supportedCountries.includes(iso2),
        [iso2],
    );

    const debouncedValue = useDebouncedValue(search);

    const globalLookupVariables = useMemo(
        (): GlobalLookupQueryVariables | undefined => (
            !(iso2 && isValidIso2) && debouncedValue
                ? { name: debouncedValue }
                : undefined
        ),
        [debouncedValue, iso2, isValidIso2],
    );

    const lookupVariables = useMemo(
        (): LookupQueryVariables | undefined => (
            (iso2 && isValidIso2) && debouncedValue
                ? { name: debouncedValue, country: iso2 }
                : undefined
        ),
        [debouncedValue, iso2, isValidIso2],
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
        skip: !globalLookupVariables,
    });

    const actualLookupData = (iso2 && isValidIso2)
        ? data?.lookup?.results
        : globalLookupData?.globalLookup?.results;
    const actualLookupLoading = (iso2 && isValidIso2)
        ? loading
        : globalLoading;

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
            const centerCordinate: Centers = [item.lon, item.lat];
            const newValue = convertToGeoLocation(item, true);
            setTempLocation(newValue);
            setCenter(centerCordinate);
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
            setCenter(undefined);
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
            setCenter(undefined);
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

    const handleMapRegionMouseEnter = useCallback(
        (feature: mapboxgl.MapboxGeoJSONFeature, lngLat: mapboxgl.LngLat) => {
            setHoveredRegionProperties({
                feature,
                lngLat,
            });
        },
        [setHoveredRegionProperties],
    );

    const handleMapRegionMouseLeave = useCallback(
        () => {
            setHoveredRegionProperties(undefined);
        },
        [setHoveredRegionProperties],
    );

    const inputDisabled = loadingReverse || disabled;

    return (
        <div className={_cs(styles.comp, className)}>
            <div className={styles.container}>
                <div className={styles.floating}>
                    {!readOnly && (
                        <Button
                            name={undefined}
                            onClick={handleSearchShownToggle}
                            icons={searchShown ? <IoCloseOutline /> : <IoAddOutline />}
                            disabled={inputDisabled || readOnly}
                        >
                            {searchShown ? 'Close' : 'Add location'}
                        </Button>
                    )}
                    {defaultBounds && (
                        <Button
                            name={undefined}
                            className={styles.button}
                            onClick={handleSetCountryBounds}
                        >
                            Fit to country
                        </Button>
                    )}
                    {value.length > 0 && (
                        <Button
                            name={undefined}
                            className={styles.button}
                            onClick={handleSetConvexBounds}
                        >
                            Fit to locations
                        </Button>
                    )}
                </div>
                <CountriesMap
                    className={styles.mapContainer}
                    bounds={bounds ?? defaultBounds}
                    center={center}
                    countries={country ? [country] : undefined}
                >
                    <MapImage
                        name="equilateral-arrow-icon"
                        url={image}
                        imageOptions={arrowImageOptions}
                        onLoad={handleIconLoad}
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
                </CountriesMap>
            </div>
            {!readOnly && searchShown && (
                <div className={styles.search}>
                    <div className={styles.filter}>
                        <TextInput
                            name="search"
                            value={search}
                            onChange={setSearch}
                            placeholder="Search"
                            autoFocus
                            icons={(
                                <IoSearchOutline />
                            )}
                            disabled={inputDisabled || readOnly}
                        />
                    </div>
                    <div className={styles.result}>
                        {actualLookupData?.map((item) => (
                            <LookupItem
                                key={item.id}
                                item={item}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleClick}
                                disabled={disabled}
                            />
                        ))}
                        {actualLookupLoading && <Loading />}
                        {!actualLookupLoading && ((actualLookupData?.length ?? 0) <= 0) && (
                            <div className={styles.message}>
                                {search ? 'No matching location available' : 'Search to add location'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeoInput;
