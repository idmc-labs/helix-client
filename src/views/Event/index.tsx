import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Modal,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import TextBlock from '#components/TextBlock';
import NumberBlock from '#components/NumberBlock';
import PageHeader from '#components/PageHeader';
import EntriesTable from '#components/tables/EntriesTable';
import EventForm from '#components/forms/EventForm';
import useModalState from '#hooks/useModalState';

import {
    EventSummaryQuery,
    EventSummaryQueryVariables,
} from '#generated/types';
import styles from './styles.css';

const EVENT = gql`
    query EventSummary($id: ID!) {
        event(id: $id) {
            id
            name
            eventType
            totalFlowNdFigures
            totalStockIdpFigures
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
            }
            glideNumber
            eventNarrative
            trigger {
                id
                name
            }
            triggerSubType {
                id
                name
            }
            violence {
                id
                name
            }
            violenceSubType {
                id
                name
            }

            disasterSubType {
                id
                name
            }
            otherSubType
        }
    }
`;

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

    const [
        shouldShowAddEventModal,
        editableEventId,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState();

    let title = 'Event';
    if (eventData?.event) {
        const crisisName = eventData.event.crisis?.name;
        const { name } = eventData.event;
        title = crisisName ? `${crisisName} › ${name}` : name;
    }

    return (
        <div className={_cs(styles.event, className)}>
            <PageHeader
                title={title}
            />
            <Container
                className={styles.container}
                contentClassName={styles.details}
                heading="Details"
                headerActions={(
                    <Button
                        name={eventData?.event?.id}
                        onClick={showAddEventModal}
                        disabled={loading || !eventData?.event?.id}
                    >
                        Edit Event
                    </Button>
                )}
            >
                {eventData ? (
                    <>
                        <div className={styles.stats}>
                            <TextBlock
                                label="Cause"
                                value={eventData?.event?.eventType}
                            />
                            <NumberBlock
                                label="New displacements"
                                value={eventData?.event?.totalFlowNdFigures}
                            />
                            <NumberBlock
                                label="No. of IDPs"
                                value={eventData?.event?.totalStockIdpFigures}
                            />
                            <TextBlock
                                label="Glide Number"
                                value={eventData?.event?.glideNumber}
                            />
                            <TextBlock
                                label="Start Date"
                                value={eventData?.event?.startDate}
                            />
                            <TextBlock
                                label="End Date"
                                value={eventData?.event?.endDate}
                            />
                        </div>
                        <div className={styles.stats}>
                            <TextBlock
                                label="Countries"
                                value={eventData?.event?.countries?.map((country) => country.idmcShortName).join(', ')}
                            />
                            {eventData?.event?.eventType === 'CONFLICT' && (
                                <>
                                    <TextBlock
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
                                        label="Trigger"
                                        value={eventData?.event?.trigger?.name}
                                    />
                                    <TextBlock
                                        label="Sub Trigger"
                                        value={eventData?.event?.triggerSubType?.name}
                                    />
                                </>
                            )}
                            {eventData?.event?.eventType === 'DISASTER' && (
                                <TextBlock
                                    label="Disaster Subtype"
                                    value={eventData?.event?.disasterSubType?.name}
                                />
                            )}
                            {eventData?.event?.eventType === 'OTHER' && (
                                <TextBlock
                                    label="Subtype"
                                    value={eventData?.event?.otherSubType}
                                />
                            )}
                        </div>
                    </>
                ) : (
                    'Details not available'
                )}
            </Container>
            <Container
                className={styles.container}
                heading="Narrative"
            >
                {eventData?.event?.eventNarrative ?? 'Narrative not available'}
            </Container>
            <EntriesTable
                className={styles.largeContainer}
                eventId={eventId}
                eventColumnHidden
                crisisColumnHidden
            />
            {shouldShowAddEventModal && (
                <Modal
                    onClose={hideAddEventModal}
                    heading={editableEventId ? 'Edit Event' : 'Add Event'}
                >
                    <EventForm
                        id={editableEventId}
                        onEventCreate={hideAddEventModal}
                        onEventFormCancel={hideAddEventModal}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Event;
