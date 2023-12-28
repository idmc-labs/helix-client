import React, { useMemo, useContext, useCallback } from 'react';
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
import EntriesFiguresTable from '#components/tables/EntriesFiguresTable';
import Status from '#components/tableHelpers/Status';
import ButtonLikeLink from '#components/ButtonLikeLink';
import route from '#config/routes';

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
            }
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
            eventCodes {
                uuid
                id
                eventCodeType
                eventCodeDisplay
                eventCode
                country {
                    id
                    idmcShortName
                    idmcFullName
                    iso3
                    iso2
                    name
                }
            }
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
    const figurePermissions = user?.permissions?.figure;

    const [
        shouldShowAddEventModal,
        editableEventId,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState<{ id: string, clone?: boolean }>();

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
                className={styles.container}
                contentClassName={styles.details}
                heading="Details"
            >
                {eventData ? (
                    <>
                        <div className={styles.stats}>
                            <TextBlock
                                label="Cause"
                                value={eventData?.event?.eventTypeDisplay}
                            />
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
                                label="Event codes"
                                value={eventData?.event?.eventCodes?.map((code) => code?.eventCode).join(', ')}
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
                                    <div />
                                    <div />
                                </>
                            )}
                            {eventData?.event?.eventType === 'DISASTER' && (
                                <>
                                    <TextBlock
                                        label="Hazard Subtype"
                                        value={eventData?.event?.disasterSubType?.name}
                                    />
                                    <div />
                                    <div />
                                    <div />
                                    <div />
                                    <div />
                                </>
                            )}
                            {eventData?.event?.eventType === 'OTHER' && (
                                <>
                                    <TextBlock
                                        label="Subtype"
                                        value={eventData?.event?.otherSubType?.name}
                                    />
                                    <div />
                                    <div />
                                    <div />
                                    <div />
                                    <div />
                                </>
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
            <EntriesFiguresTable
                className={styles.largeContainer}
                eventColumnHidden
                crisisColumnHidden
                eventId={eventId}
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
