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

    return (
        <div className={styles.notification}>
            {notification.type}
        </div>
    );
}

export default NotificationContent;
