import React from 'react';

import SmartLink from '#components/SmartLink';

import route from '#config/routes';
import {
    NotificationsQuery,
} from '#generated/types';

import styles from './styles.css';

type NotificationType = NonNullable<NonNullable<NotificationsQuery['notifications']>['results']>[number];

export interface Props {
    notification: NotificationType,
}

function NotificationContent(props: Props) {
    const {
        notification,
    } = props;

    if (notification.type === 'EVENT_ASSIGNED' && notification.event) {
        return (
            <div className={styles.notification}>
                You were assigned to review the event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'EVENT_ASSIGNEE_CLEARED' && notification.event) {
        return (
            <div className={styles.notification}>
                Assignee were removed from event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'EVENT_SELF_ASSIGNED' && notification.event) {
        return (
            <div className={styles.notification}>
                Assignee was set to the event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    // FIXME: not working
    if (notification.type === 'FIGURE_UNAPPROVED_IN_SIGNED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure unapproved in signed event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    // FIXME: not working
    if (notification.type === 'FIGURE_UNAPPROVED_IN_APPROVED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure unapproved in the event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'REVIEW_COMMENT_CREATED' && notification.event) {
        return (
            <div className={styles.notification}>
                Comment on the figure
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    // FIXME: not working
    if (notification.type === 'FIGURE_RE_REQUESTED_REVIEW' && notification.event) {
        return (
            <div className={styles.notification}>
                Event figure is re-requested for review.
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'EVENT_APPROVED' && notification.event) {
        return (
            <div className={styles.notification}>
                Approved event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'EVENT_SIGNED_OFF' && notification.event) {
        return (
            <div className={styles.notification}>
                Signed off event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'FIGURE_CREATED_IN_APPROVED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure added in the approved event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }
    if (notification.type === 'FIGURE_UPDATED_IN_APPROVED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure updated in the approved event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    // FIXME: updated and deleted status same from server
    if (notification.type === 'FIGURE_DELETED_IN_APPROVED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure deleted in the approved event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'FIGURE_UNAPPROVED_IN_SIGNED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure unapproved in the signed off event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'FIGURE_UPDATED_IN_SIGNED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure updated in the signed off event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    if (notification.type === 'FIGURE_CREATED_IN_SIGNED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure added in the signed off event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    // FIXME: updated and deleted status same from server
    if (notification.type === 'FIGURE_DELETED_IN_SIGNED_EVENT' && notification.event) {
        return (
            <div className={styles.notification}>
                Figure deleted in the signed off event
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    // FIXME: confused condition
    if (notification.type === 'EVENT_INCLUDE_TRIANGULATION_CHANGED' && notification.event) {
        return (
            <div className={styles.notification}>
                Triangulation changed in figure
                <SmartLink
                    route={route.event}
                    attrs={{ eventId: notification.event.id }}
                >
                    {notification.event.name}
                </SmartLink>
            </div>
        );
    }

    return (
        <div className={styles.notification}>
            {notification.type}
        </div>
    );
}

export default NotificationContent;
