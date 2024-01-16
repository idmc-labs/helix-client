import React from 'react';
import Map, {
    MapContainer,
    MapBounds,
    MapCenter,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';

export type Bounds = [number, number, number, number];
export type Centers = [number, number];

const lightStyle = 'mapbox://styles/togglecorp/cl50rwy0a002d14mo6w9zprio';

const countryFillPaint: mapboxgl.FillPaint = {
    'fill-color': '#e0e8f0',
    'fill-opacity': 1,
};

const countryLinePaint: mapboxgl.LinePaint = {
    'line-color': '#3E5963',
    'line-width': 1.5,
};

interface CountriesMapProps {
    className?: string;
    bounds?: Bounds | undefined;
    center?: Centers | undefined;
    countries?: { id: string, geojsonUrl?: string | null }[] | null;
    children?: React.ReactNode;
}

function CountriesMap(props: CountriesMapProps) {
    const {
        className,
        bounds,
        center,
        countries,
        children,
    } = props;

    return (
        <Map
            mapStyle={lightStyle}
            mapOptions={{
                logoPosition: 'bottom-left',
                scrollZoom: false,
            }}
            scaleControlShown
            navControlShown
            scaleControlPosition="bottom-right"
            navControlPosition="top-left"
        >
            <MapContainer className={className} />
            {countries?.map((country) => (!!country.geojsonUrl && (
                <MapSource
                    key={country.id}
                    sourceKey={`country-${country.id}`}
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
                        // NOTE: this is the lowest line layer in mapstyle
                        beneath="tunnel-street-minor-low"
                    />
                    <MapLayer
                        layerKey="country-line"
                        layerOptions={{
                            type: 'line',
                            paint: countryLinePaint,
                        }}
                        // NOTE: this is the lowest point layer in mapstyle
                        beneath="road-label"
                    />
                </MapSource>
            )))}
            {children}
            {!center && bounds && (
                <MapBounds
                    bounds={bounds as Bounds | undefined}
                    padding={50}
                />
            )}
            {center && (
                <MapCenter
                    center={center as Centers | undefined}
                    centerOptions={{
                        maxDuration: 1000,
                    }}
                />
            )}
        </Map>
    );
}

export default CountriesMap;
