import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Avatar,
    DateTime,
} from '@togglecorp/toggle-ui';

import {
    diff,
    formatElapsedTime,
} from '#utils/common';
import {
    GiddStatusLogTypeEnum,
} from '#generated/types';

import styles from './styles.css';

interface DownloadedItemProps {
    className?: string;
    triggeredDate: string;
    completedDate: string | null | undefined;
    status: GiddStatusLogTypeEnum | null | undefined;
    triggeredBy: {
        id: string;
        fullName: string;
    } | null | undefined;
}

function StatusLogItem(props: DownloadedItemProps) {
    const {
        className,
        triggeredDate,
        completedDate,
        status,
        triggeredBy,
    } = props;

    let description = '';
    if (status === 'FAILED') {
        description = 'GIDD data update failed.';
    }
    if (status === 'PENDING') {
        description = 'Updating GIDD data.';
    }
    if (status === 'SUCCESS') {
        description = 'GIDD data update completed successfully.';
    }
    return (
        <div className={_cs(styles.comment, className)}>
            <div
                className={styles.avatar}
            >
                <Avatar
                    alt={triggeredBy?.fullName || 'Anon'}
                    sizes="small"
                />
            </div>
            <div className={styles.content}>
                <div>
                    {description}
                </div>
                {triggeredDate && completedDate && (
                    <div>
                        {`The process took ${formatElapsedTime(diff(completedDate, triggeredDate))}.`}
                    </div>
                )}
                <DateTime
                    className={styles.date}
                    value={triggeredDate}
                    format="datetime"
                />
            </div>
        </div>
    );
}

export default StatusLogItem;
