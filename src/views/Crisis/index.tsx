import React, { useMemo, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs, isDefined } from '@togglecorp/fujs';
import Map, {
    MapContainer,
    MapBounds,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';
import {
    Button,
    Modal,
} from '@togglecorp/toggle-ui';

import { mergeBbox } from '#utils/common';
import { MarkdownPreview } from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import TextBlock from '#components/TextBlock';
import NumberBlock from '#components/NumberBlock';

import CrisisForm from '#components/forms/CrisisForm';
import EventsEntriesFiguresTable from '#components/tables/EventsEntriesFiguresTable';
import useModalState from '#hooks/useModalState';

import {
    CrisisQuery,
    CrisisQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const CRISIS = gql`
    query Crisis($id: ID!) {
        crisis(id: $id) {
            countries {
                id
                idmcShortName
                boundingBox
                geojsonUrl
            }
            crisisNarrative
            crisisType
            crisisTypeDisplay
            endDate
            id
            name
            startDate
            totalFlowNdFigures
            totalStockIdpFigures
            stockIdpFiguresMaxEndDate
        }
    }
`;

type Bounds = [number, number, number, number];

const lightStyle = 'mapbox://styles/togglecorp/cl50rwy0a002d14mo6w9zprio';

const countryFillPaint: mapboxgl.FillPaint = {
    'fill-color': '#354052', // empty color
    'fill-opacity': 0.2,
};

const countryLinePaint: mapboxgl.LinePaint = {
    'line-color': '#334053',
    'line-width': 1,
};

interface CrisisProps {
    className?: string;
}

function Crisis(props: CrisisProps) {
    const { className } = props;

    const { crisisId } = useParams<{ crisisId: string }>();

    const crisisVariables = useMemo(
        (): CrisisQueryVariables => ({
            id: crisisId,
        }),
        [crisisId],
    );

    const {
        data: crisisData,
        loading,
    } = useQuery<CrisisQuery, CrisisQueryVariables>(CRISIS, {
        variables: crisisVariables,
    });

    const { user } = useContext(DomainContext);
    const crisisPermissions = user?.permissions?.crisis;

    const [
        shouldShowAddCrisisModal,
        editableCrisisId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

    const bounds = mergeBbox(
        crisisData?.crisis?.countries
            ?.map((country) => country.boundingBox as (GeoJSON.BBox | null | undefined))
            .filter(isDefined),
    );

    return (
        <div className={_cs(styles.crisis, className)}>
            <PageHeader
                title={crisisData?.crisis?.name ?? 'Crisis'}
                actions={crisisPermissions?.change && (
                    <Button
                        name={crisisData?.crisis?.id}
                        onClick={showAddCrisisModal}
                        disabled={loading || !crisisData?.crisis?.id}
                    >
                        Edit Crisis
                    </Button>
                )}
            />
            <Container
                className={styles.extraLargeContainer}
                contentClassName={styles.details}
                heading="Details"
            >
                <div className={styles.stats}>
                    <NumberBlock
                        label="Internal displacements"
                        value={crisisData?.crisis?.totalFlowNdFigures}
                    />
                    <NumberBlock
                        label={
                            crisisData?.crisis?.stockIdpFiguresMaxEndDate
                                ? `No. of IDPs as of ${crisisData.crisis.stockIdpFiguresMaxEndDate}`
                                : 'No. of IDPs'
                        }
                        value={crisisData?.crisis?.totalStockIdpFigures}
                    />
                    <TextBlock
                        label="Start Date"
                        value={crisisData?.crisis?.startDate}
                    />
                    <TextBlock
                        label="End Date"
                        value={crisisData?.crisis?.endDate}
                    />
                    <TextBlock
                        label="Cause"
                        value={crisisData?.crisis?.crisisTypeDisplay}
                    />
                    <TextBlock
                        label="Countries"
                        value={crisisData?.crisis?.countries?.map((country) => country.idmcShortName).join(', ')}
                    />
                </div>
                <Map
                    mapStyle={lightStyle}
                    mapOptions={{
                        logoPosition: 'bottom-left',
                    }}
                    scaleControlShown
                    navControlShown
                >
                    <MapContainer className={styles.mapContainer} />
                    <MapBounds
                        bounds={bounds as Bounds | undefined}
                        padding={50}
                    />
                    {crisisData?.crisis?.countries?.map((country) => (!!country.geojsonUrl && (
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
                            />
                            <MapLayer
                                layerKey="country-line"
                                layerOptions={{
                                    type: 'line',
                                    paint: countryLinePaint,
                                }}
                            />
                        </MapSource>
                    )))}
                </Map>
            </Container>
            <Container
                className={styles.container}
                heading="Narrative"
            >
                <MarkdownPreview
                    markdown={crisisData?.crisis?.crisisNarrative ?? 'Narrative not available'}
                />
            </Container>
            <EventsEntriesFiguresTable
                className={styles.largeContainer}
                // FIXME: we should not use this
                // NOTE: replacing with a placeholder crisis so that the id is always defined
                crisis={crisisData?.crisis ?? { id: crisisId, name: '???' }}
            />
            {shouldShowAddCrisisModal && (
                <Modal
                    onClose={hideAddCrisisModal}
                    heading={editableCrisisId ? 'Edit Crisis' : 'Add Crisis'}
                    size="large"
                    freeHeight
                >
                    <CrisisForm
                        id={editableCrisisId}
                        onCrisisCreate={hideAddCrisisModal}
                        onCrisisFormCancel={hideAddCrisisModal}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Crisis;
