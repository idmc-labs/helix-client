import React, { useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoNotifications,
} from 'react-icons/io5';

import DomainContext from '#components/DomainContext';
import route from '#config/routes';
import Badge from '#components/Badge';
import ButtonLikeLink from '#components/ButtonLikeLink';
import {
    NotificationsCountQuery,
    NotificationsCountQueryVariables,
} from '#generated/types';

import styles from './styles.css';

// NOTE: exporting this so that other requests can refetch this request
export const NOTIFICATIONS_COUNT = gql`
    query NotificationsCount($recipient: ID!)  {
        notifications(recipient: $recipient, isRead: false) {
            totalCount
        }
    }
`;

interface Props {
    className?: string;
    buttonClassName?: string;
}

function Notifications(props: Props) {
    const {
        className,
        buttonClassName,
    } = props;

    const { user } = useContext(DomainContext);

    const userId = user?.id;

    const {
        data,
    } = useQuery<NotificationsCountQuery, NotificationsCountQueryVariables>(NOTIFICATIONS_COUNT, {
        skip: !userId,
        pollInterval: 5_000,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
        variables: userId ? {
            recipient: userId,
        } : undefined,
    });

    const count = data?.notifications?.totalCount;

    return (
        <div className={_cs(styles.notifications, className)}>
            <ButtonLikeLink
                className={buttonClassName}
                transparent
                icons={(
                    <IoNotifications />
                )}
                route={route.notifications}
            />
            <Badge
                className={styles.badge}
                count={count}
            />
        </div>
    );
}
export default Notifications;
