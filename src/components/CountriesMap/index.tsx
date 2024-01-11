import React from 'react';
import Map, {
    MapContainer,
    MapBounds,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';

export type Bounds = [number, number, number, number];

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
    countries?: { id: string, geojsonUrl?: string | null }[] | null;
}

function CountriesMap(props: CountriesMapProps) {
    const {
        className,
        bounds,
        countries,
    } = props;

    return (
        <Map
            mapStyle={lightStyle}
            mapOptions={{
                logoPosition: 'bottom-left',
            }}
            scaleControlShown
            navControlShown
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
            <MapBounds
                bounds={bounds as Bounds | undefined}
                padding={50}
            />
        </Map>
    );
}

export default CountriesMap;
