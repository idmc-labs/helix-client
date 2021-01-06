import React, { useState, useMemo, useCallback } from 'react';
import { gql, useQuery, useLazyQuery } from '@apollo/client';
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
    onMouseLeave: () => void;
    onClick: (item: LookupData) => void;
}

function LookupItem(props: LookupItemProps) {
    const {
        item,
        onMouseLeave,
        onMouseEnter,
        onClick,
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
    const [movedPoint, setMovedPoint] = useState<MovedPoint | undefined>();

    const geo = useDebouncedValue(
        value,
        undefined,
        convertToGeo,
    );

    const defaultBounds = country?.boundingBox;
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
            setBounds(item.boundingbox as Bounds);
        },
        [],
    );

    const handleMouseLeave = useCallback(
        () => {
            setBounds(undefined);
        },
        [],
    );

    const handleClick = useCallback(
        (item: LookupData) => {
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
            onChange([...value, newValue], name);
            setSearch(undefined);
            setSearchShown(false);
            setBounds(undefined);
        },
        [onChange, value, name],
    );

    const handleSearchShownToggle = useCallback(
        () => {
            setSearchShown((item) => !item);
        },
        [],
    );

    const inputDisabled = readOnly || loadingReverse || disabled;

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
                    <Button
                        className={styles.addButton}
                        name={undefined}
                        onClick={handleSearchShownToggle}
                        title={searchShown ? 'Close' : 'Add'}
                        icons={searchShown ? <IoMdClose /> : <IoMdAdd />}
                    >
                        {searchShown ? 'Close' : 'Add location'}
                    </Button>
                    <MapContainer className={styles.mapContainer} />
                </div>
                <MapBounds
                    bounds={(bounds ?? (defaultBounds as Bounds | null | undefined) ?? undefined)}
                    padding={10}
                />
                <MapSource
                    sourceKey="locations"
                    sourceOptions={locationsSourceOptions}
                    geoJson={geo}
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
                            disabled={inputDisabled || !iso2}
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
