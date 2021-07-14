import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';

import Container from '#components/Container';
import TextBlock from '#components/TextBlock';
import PageHeader from '#components/PageHeader';
import EntriesTable from '#components/tables/EntriesTable';

import {
    EventSummaryQuery,
    EventSummaryQueryVariables,
} from '#generated/types';
import styles from './styles.css';

const EVENT = gql`
    query EventSummary($id: ID!) {
        event(id: $id) {
            id
            eventNarrative
            name
            crisis {
               id
               name
               crisisType
            }
            endDate
            endDateAccuracy
            startDate
            startDateAccuracy
            glideNumber
            countries {
                id
                idmcShortName
            }
            trigger {
                id
            }
            triggerSubType {
                id
            }
            violence {
                id
                name
            }
            violenceSubType {
                id
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

    const { data: eventData } = useQuery<EventSummaryQuery, EventSummaryQueryVariables>(EVENT, {
        variables: eventVariables,
    });

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
                heading="Summary"
            >
                {eventData?.event?.eventNarrative ?? 'Summary not available'}
            </Container>
            <Container
                className={styles.container}
                contentClassName={styles.eventInfoTip}
                heading="Event Details"
            >
                {eventData ? (
                    <>
                        <div className={styles.stats}>
                            <TextBlock
                                label="Event Name"
                                value={eventData?.event?.name}
                            />
                            <TextBlock
                                label="Crisis"
                                value={eventData?.event?.crisis?.name}
                            />
                            <TextBlock
                                label="Crisis Type"
                                value={eventData?.event?.crisis?.crisisType}
                            />
                            <TextBlock
                                label="Cause"
                                value={null}
                            />
                            <TextBlock
                                label="Glide Number"
                                value={eventData?.event?.glideNumber}
                            />
                        </div>
                        <div className={styles.stats}>
                            <TextBlock
                                label="Start Date"
                                value={eventData?.event?.startDate}
                            />
                            <TextBlock
                                label="Start Date Accuracy"
                                value={eventData?.event?.startDateAccuracy}
                            />
                            <TextBlock
                                label="End Date"
                                value={eventData?.event?.endDate}
                            />
                            <TextBlock
                                label="End Date Accuracy"
                                value={eventData?.event?.endDateAccuracy}
                            />
                        </div>
                    </>
                ) : (
                    'Details not available'
                )}
            </Container>
            <EntriesTable
                className={styles.largeContainer}
                eventId={eventId}
                eventColumnHidden
                crisisColumnHidden
            />
        </div>
    );
}

export default Event;
