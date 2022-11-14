import React from 'react';
import { _cs } from '@togglecorp/fujs';

import SmartLink from '#components/SmartLink';
// import NotificationContext from '#components/NotificationContext';
import route from '#config/routes';

import styles from './styles.css';

interface Props {
    className?: string;
}

function NotificationCategory(props: Props) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.itemRow, className)}>
            <SmartLink
                className={styles.categoryName}
                route={route.notifications}
            >
                All Notifications
            </SmartLink>
            <SmartLink
                className={styles.categoryName}
                route={route.notifications}
            >
                QA
            </SmartLink>
            <SmartLink
                className={styles.categoryName}
                route={route.notifications}
            >
                Admin
            </SmartLink>
            <SmartLink
                className={styles.categoryName}
                route={route.notifications}
            >
                Events
            </SmartLink>
        </div>
    );
}

export default NotificationCategory;
