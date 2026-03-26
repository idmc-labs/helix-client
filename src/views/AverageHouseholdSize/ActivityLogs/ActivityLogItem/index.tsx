import React from 'react';

import { Avatar } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import DateTime from '#components/DateTime';

import {
    diff,
    formatElapsedTime,
} from '#utils/common';
import {
    AhhsActivityLogQuery,
} from '#generated/types';

import styles from './styles.module.css';

type ActivityLogItemType = NonNullable<NonNullable<NonNullable<AhhsActivityLogQuery['householdSizeBulkOperationList']>['results']>[number]>;
type HouseholdSizeStatusType = ActivityLogItemType['status'];

interface Props {
    className?: string;
    startedDate: string;
    completedDate: string | null | undefined;
    targetYear: number;
    triggeredBy: {
        id: string;
        fullName: string;
    } | null | undefined;
    status: HouseholdSizeStatusType | null | undefined;
    failureReasons: string[];
}

function ActivityLogItem(props: Props) {
    const {
        className,
        startedDate: triggeredDate,
        completedDate,
        triggeredBy,
        targetYear,
        status,
        failureReasons,
    } = props;

    let description = '';
    if (status === 'PENDING' || status === 'IN_PROGRESS') {
        description = `AHHS carry over is in-progress initiated by ${triggeredBy?.fullName}.`;
    }
    if (status === 'COMPLETED') {
        description = `AHHS carried over successfully for ${targetYear} by ${triggeredBy?.fullName}.`;
    }
    if (status === 'FAILED') {
        description = `AHHS carry over failed for ${targetYear} due to ${failureReasons.join(', ')}`;
    }
    if (status === 'KILLED') {
        description = `AHHS carry over aborted by ${triggeredBy?.fullName}`;
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
                {triggeredDate && completedDate && status !== 'PENDING' && status !== 'IN_PROGRESS' && (
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
export default ActivityLogItem;
