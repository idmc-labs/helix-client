import React, { useMemo, useContext } from 'react';
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

import { MarkdownPreview } from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';
import Container from '#components/Container';
import TextBlock from '#components/TextBlock';
import NumberBlock from '#components/NumberBlock';
import PageHeader from '#components/PageHeader';
import EventForm from '#components/forms/EventForm';
import useModalState from '#hooks/useModalState';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';
import EntriesTable from '#components/tables/EntriesTable';

import {
    EventSummaryQuery,
    EventSummaryQueryVariables,
} from '#generated/types';

import EventCloneForm from './EventCloneForm';
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
            glideNumbers
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

    const { user } = useContext(DomainContext);
    const eventPermissions = user?.permissions?.event;

    const [
        shouldShowEventCloneModal,
        eventIdToClone,
        showEventCloneModal,
        hideEventCloneModal,
    ] = useModalState();

    const [
        shouldShowAddEventModal,
        editableEventId,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState();

    const [
        alertShown,
        clonedEvent,
        showAlert,
        hideAlert,
    ] = useModalState<string>(false);

    let title = 'Event';
    if (eventData?.event) {
        const crisisName = eventData.event.crisis?.name;
        const { name } = eventData.event;
        title = crisisName ? `${crisisName} › ${name}` : name;
    }

    const handleCloneEntryButtonClick = React.useCallback(
        () => {
            showEventCloneModal(eventId);
        },
        [eventId, showEventCloneModal],
    );

    const handleCloneModalClose = React.useCallback(
        (event?: string) => {
            if (event) {
                showAlert(event);
            }
            hideEventCloneModal();
        },
        [showAlert, hideEventCloneModal],
    );

    const handleAlertAction = React.useCallback(
        () => {
            const eventRoute = reverseRoute(
                route.event.path,
                { eventId: clonedEvent },
            );
            const cloneUrl = window.location.origin + eventRoute;
            window.open(`${cloneUrl}`, '_blank');
            hideAlert();
        },
        [clonedEvent, hideAlert],
    );

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
                    <>
                        {eventPermissions?.add && (
                            <Button
                                name={undefined}
                                variant="default"
                                onClick={handleCloneEntryButtonClick}
                                disabled={loading || !eventData?.event?.id}
                            >
                                Clone
                            </Button>
                        )}
                        {eventPermissions?.change && (
                            <Button
                                name={eventData?.event?.id}
                                onClick={showAddEventModal}
                                disabled={loading || !eventData?.event?.id}
                            >
                                Edit Event
                            </Button>
                        )}
                    </>
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
                                label="Event Codes"
                                value={eventData?.event?.glideNumbers?.map((glideID) => glideID).join(', ')}
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
                <MarkdownPreview
                    markdown={eventData?.event?.eventNarrative ?? 'Narrative not available'}
                />
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
            {shouldShowEventCloneModal && eventId && (
                <Modal
                    onClose={hideEventCloneModal}
                    heading="Clone Event"
                >
                    <EventCloneForm
                        eventId={eventIdToClone}
                        onCloseForm={handleCloneModalClose}
                    />
                </Modal>
            )}
            {alertShown && (
                <Modal
                    heading="Cloned Event"
                    onClose={hideAlert}
                    footerClassName={styles.actionButtonsRow}
                    footer={(
                        <>
                            <Button
                                name={undefined}
                                onClick={hideAlert}
                                className={styles.actionButton}
                            >
                                Cancel
                            </Button>
                            <Button
                                name={undefined}
                                onClick={handleAlertAction}
                                variant="primary"
                                className={styles.actionButton}
                                autoFocus
                            >
                                Ok
                            </Button>
                        </>
                    )}
                >
                    Would you like to open the cloned event in new tab?
                    You can also find it on the events page.
                </Modal>
            )}
        </div>
    );
}

export default Event;
