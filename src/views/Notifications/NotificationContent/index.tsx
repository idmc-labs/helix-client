import React from 'react';

import SmartLink from '#components/SmartLink';

import route from '#config/routes';
import {
    NotificationsQuery,
} from '#generated/types';
import {
    prepareUrlParams,
} from '#utils/common';

import styles from './styles.css';

type NotificationType = NonNullable<NonNullable<NotificationsQuery['notifications']>['results']>[number];

export interface Props {
    notification: NotificationType,
}

const deletedEventName = '[deleted event]';
const deletedFigureName = '[deleted figure]';
const deletedEntryName = '[deleted entry]';

function NotificationContent(props: Props) {
    const {
        notification,
    } = props;

    const {
        figure,
        event,
        entry,
        reviewComment,
    } = notification;

    const eventLink = (
        event ? (
            <SmartLink
                route={route.event}
                attrs={{ eventId: event.id }}
            >
                {event.name}
            </SmartLink>
        ) : (
            <span className={styles.dudLink}>
                {deletedEventName}
            </span>
        )
    );

    const entryLink = (
        entry ? (
            <SmartLink
                route={route.entryView}
                attrs={{
                    entryId: entry.id,
                }}
            >
                entry
            </SmartLink>
        ) : (
            <span className={styles.dudLink}>
                {deletedEntryName}
            </span>
        )
    );

    const figureLink = (
        figure && entry ? (
            <SmartLink
                route={route.entryView}
                attrs={{
                    entryId: entry.id,
                }}
                hash="/figures-and-analysis"
                search={prepareUrlParams({
                    id: figure.id,
                    field: reviewComment?.field,
                })}
            >
                figure
            </SmartLink>
        ) : (
            <span className={styles.dudLink}>
                {deletedFigureName}
            </span>
        )
    );

    if (notification.type === 'EVENT_ASSIGNED') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                You were assigned to review the event {eventLink}
            </div>
        );
    }

    // TODO: we should make separate enum for assignee and others
    // EVENT_ASSIGNEE_CLEARED
    // EVENT_ASSIGNEE_SELF_CLEARED
    // or, we introduce concept of actor and patient
    if (notification.type === 'EVENT_ASSIGNEE_CLEARED') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Assignee was cleared from the event {eventLink}
            </div>
        );
    }

    if (notification.type === 'EVENT_SELF_ASSIGNED') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Assignee was set to the event {eventLink}
            </div>
        );
    }

    if (notification.type === 'FIGURE_UNAPPROVED_IN_SIGNED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A {figureLink} was unapproved in signed off event {eventLink}
            </div>
        );
    }

    if (notification.type === 'FIGURE_UNAPPROVED_IN_APPROVED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A {figureLink} was unapproved in approved event {eventLink}
            </div>
        );
    }

    if (notification.type === 'REVIEW_COMMENT_CREATED') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A new comment on the {figureLink} in the event {eventLink}
            </div>
        );
    }

    if (notification.type === 'FIGURE_RE_REQUESTED_REVIEW') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                Review requested on the {figureLink} in the event {eventLink}
            </div>
        );
    }

    if (notification.type === 'EVENT_APPROVED') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                The event {eventLink} has been approved.
            </div>
        );
    }

    if (notification.type === 'EVENT_SIGNED_OFF') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                The event {eventLink} has been signed off.
            </div>
        );
    }

    if (notification.type === 'FIGURE_CREATED_IN_APPROVED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A {figureLink} was created in approved event {eventLink}
            </div>
        );
    }
    if (notification.type === 'FIGURE_UPDATED_IN_APPROVED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A {figureLink} was updated in approved event {eventLink}
            </div>
        );
    }

    if (notification.type === 'FIGURE_DELETED_IN_APPROVED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A figure in {entryLink} was deleted in approved event {eventLink}
            </div>
        );
    }

    if (notification.type === 'FIGURE_UPDATED_IN_SIGNED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A {figureLink} was updated in signed off event {eventLink}
            </div>
        );
    }

    if (notification.type === 'FIGURE_CREATED_IN_SIGNED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A {figureLink} was created in signed off event {eventLink}
            </div>
        );
    }

    if (notification.type === 'FIGURE_DELETED_IN_SIGNED_EVENT') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                A figure in {entryLink} was deleted in signed off event {eventLink}
            </div>
        );
    }

    if (notification.type === 'EVENT_INCLUDE_TRIANGULATION_CHANGED') {
        return (
            <div className={styles.notification}>
                {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
                &quot;Included in Triangulation&quot; changed in the event {eventLink}
            </div>
        );
    }

    return (
        <div className={styles.notification}>
            {/* eslint-disable-next-line react/jsx-one-expression-per-line */}
            Unhandled notification of type {notification.type}
        </div>
    );
}

export default NotificationContent;
