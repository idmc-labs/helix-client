import React from 'react';
import { Avatar } from '@togglecorp/toggle-ui';

import DateTime from '#components/DateTime';

import styles from './styles.css';

interface UserItemProps {
    name: string;
    date?: string | null;
}
function UserItem(props: UserItemProps) {
    const {
        name,
        date,
    } = props;

    return (
        <div className={styles.comment}>
            <div
                className={styles.avatar}
            >
                <Avatar
                    alt={name}
                    sizes="small"
                />
            </div>
            <div className={styles.content}>
                <div>
                    {name}
                </div>
                <DateTime
                    className={styles.date}
                    value={date}
                    format="datetime"
                />
            </div>
        </div>
    );
}

export default UserItem;
