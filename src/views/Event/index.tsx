import React, { useMemo, useContext, useCallback } from 'react';
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
import TextBlock from '#components/TextBlock';
import NumberBlock from '#components/NumberBlock';
import PageHeader from '#components/PageHeader';
import EventForm from '#components/forms/EventForm';
import useModalState from '#hooks/useModalState';
import Status from '#components/tableHelpers/Status';
import ButtonLikeLink from '#components/ButtonLikeLink';
import route from '#config/routes';

import {
    EventSummaryQuery,
    EventSummaryQueryVariables,
} from '#generated/types';

import CountriesEntriesFiguresTable from './CountriesEntriesFiguresTable';
import styles from './styles.css';

const EVENT = gql`
    query EventSummary($id: ID!) {
        event(id: $id) {
            id
            name
            eventType
            eventTypeDisplay
            totalFlowNdFigures
            totalStockIdpFigures
            stockIdpFiguresMaxEndDate
            reviewStatus
            crisis {
                id
                name
            }
            startDate
            endDate
            actor {
                id
                name
            }
            countries {
                id
                idmcShortName
                boundingBox
                geojsonUrl
            }
            glideNumbers
            eventNarrative
            violence {
                id
                name
            }
            violenceSubType {
                id
                name
            }
            contextOfViolence {
                id
                name
            }
            disasterSubType {
                id
                name
            }
            otherSubType {
                id
                name
            }
            assignee {
                id
                username
            }
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

const now = new Date();

interface EventProps {
    className?: string;
}

function Event(props: EventProps) {
    const { className } = props;

    const { eventId } = useParams<{ eventId: string }>();

    const eventVariables = useMemo(
        (): EventSummaryQueryVariables => ({
            id: eventId,
        }),
        [eventId],
    );

    const {
        data: eventData,
        loading,
    } = useQuery<EventSummaryQuery, EventSummaryQueryVariables>(EVENT, {
        variables: eventVariables,
    });

    const { user } = useContext(DomainContext);
    const eventPermissions = user?.permissions?.event;
    const figurePermissions = user?.permissions?.figure;

    const [
        shouldShowAddEventModal,
        editableEventId,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState<{ id: string, clone?: boolean }>();

    const eventYear = new Date(
        eventData?.event?.endDate ?? eventData?.event?.startDate ?? now,
    ).getFullYear();

    let title = 'Event';
    if (eventData?.event) {
        const crisisName = eventData.event.crisis?.name;
        const { name } = eventData.event;
        title = crisisName ? `${crisisName} › ${name}` : name;
    }

    // NOTE: show review link if user can sign-off and event is approved/signed-off
    // NOTE: or user can approve and user is the assignee
    const reviewLinkShown = useMemo(
        () => ((
            (eventData?.event?.reviewStatus === 'APPROVED' || eventData?.event?.reviewStatus === 'SIGNED_OFF')
            && !!eventPermissions?.sign_off
        ) || (
            !!figurePermissions?.approve
            && !!eventData?.event?.assignee
            && eventData.event.assignee.id === user?.id
        )),
        [eventData, figurePermissions, eventPermissions, user],
    );

    const handleEventEdit = useCallback(
        (id: string) => {
            showAddEventModal({ id, clone: false });
        },
        [showAddEventModal],
    );

    const handleEventClone = useCallback(
        (id: string) => {
            showAddEventModal({ id, clone: true });
        },
        [showAddEventModal],
    );

    const eventStatus = eventData?.event?.reviewStatus;

    const bounds = mergeBbox(
        eventData?.event?.countries
            ?.map((country) => country.boundingBox as (GeoJSON.BBox | null | undefined))
            .filter(isDefined),
    );

    return (
        <div className={_cs(styles.event, className)}>
            <PageHeader
                title={title}
                icons={eventStatus && (
                    <Status
                        className={styles.eventStatus}
                        status={eventStatus}
                    />
                )}
                actions={eventData?.event?.id && (
                    <>
                        {reviewLinkShown && (
                            <ButtonLikeLink
                                title="Review"
                                route={route.eventReview}
                                attrs={{ eventId }}
                            >
                                Review Event
                            </ButtonLikeLink>
                        )}
                        {eventPermissions?.add && (
                            <Button
                                name={eventData.event.id}
                                onClick={handleEventClone}
                                disabled={loading}
                            >
                                Clone Event
                            </Button>
                        )}
                        {eventPermissions?.change && (
                            <Button
                                name={eventData.event.id}
                                onClick={handleEventEdit}
                                disabled={loading}
                            >
                                Edit Event
                            </Button>
                        )}
                    </>
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
                        value={eventData?.event?.totalFlowNdFigures}
                    />
                    <NumberBlock
                        label={
                            eventData?.event?.stockIdpFiguresMaxEndDate
                                ? `No. of IDPs as of ${eventData.event.stockIdpFiguresMaxEndDate}`
                                : 'No. of IDPs'
                        }
                        value={eventData?.event?.totalStockIdpFigures}
                    />
                    <TextBlock
                        label="Start Date"
                        value={eventData?.event?.startDate}
                    />
                    <TextBlock
                        label="End Date"
                        value={eventData?.event?.endDate}
                    />
                    <TextBlock
                        label="Cause"
                        value={eventData?.event?.eventTypeDisplay}
                    />
                    <TextBlock
                        label="Event Codes"
                        value={eventData?.event?.glideNumbers?.map((glideID) => glideID).join(', ')}
                    />
                    <TextBlock
                        label="Countries"
                        value={eventData?.event?.countries?.map((country) => country.idmcShortName).join(', ')}
                    />
                    {eventData?.event?.eventType === 'CONFLICT' && (
                        <>
                            <TextBlock
                                // NOTE: This block is hidden
                                className={styles.hidden}
                                label="Actor"
                                value={eventData?.event?.actor?.name}
                            />
                            <TextBlock
                                label="Violence Type"
                                value={eventData?.event?.violence?.name}
                            />
                            <TextBlock
                                label="Violence Subtype"
                                value={eventData?.event?.violenceSubType?.name}
                            />
                            <TextBlock
                                label="Context of Violence"
                                value={eventData?.event?.contextOfViolence?.map((context) => context.name).join(', ')}
                            />
                        </>
                    )}
                    {eventData?.event?.eventType === 'DISASTER' && (
                        <TextBlock
                            label="Hazard Subtype"
                            value={eventData?.event?.disasterSubType?.name}
                        />
                    )}
                    {eventData?.event?.eventType === 'OTHER' && (
                        <TextBlock
                            label="Subtype"
                            value={eventData?.event?.otherSubType?.name}
                        />
                    )}
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
                    {eventData?.event?.countries?.map((country) => (!!country.geojsonUrl && (
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
                    markdown={eventData?.event?.eventNarrative ?? 'Narrative not available'}
                />
            </Container>
            <CountriesEntriesFiguresTable
                className={styles.largeContainer}
                eventId={eventId}
                eventYear={eventYear}
            />
            {shouldShowAddEventModal && (
                <Modal
                    onClose={hideAddEventModal}
                    // eslint-disable-next-line no-nested-ternary
                    heading={editableEventId?.id
                        ? (editableEventId?.clone ? 'Clone Event' : 'Edit Event')
                        : 'Add Event'}
                    size="large"
                    freeHeight
                >
                    <EventForm
                        onEventCreate={hideAddEventModal}
                        onEventFormCancel={hideAddEventModal}
                        id={editableEventId?.id}
                        clone={editableEventId?.clone}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Event;
