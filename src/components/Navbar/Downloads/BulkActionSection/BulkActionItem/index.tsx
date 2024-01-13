import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import { DateTime } from '@togglecorp/toggle-ui';
import { IoInformationCircleOutline } from 'react-icons/io5';

import { diff, formatElapsedTime } from '#utils/common';
import {
    Bulk_Operation_Status as BulkOperationStatus,
    Bulk_Operation_Action as BulkOperationAction,
    BulkApiOperationsQuery,
} from '#generated/types';

import styles from './styles.css';

type Payload = NonNullable<NonNullable<BulkApiOperationsQuery['bulkApiOperations']>['results']>[number]['payload'];

interface DownloadedItemProps {
    className?: string;
    createdDate: string | null | undefined;
    startedDate: string | null | undefined;
    completedDate: string | null | undefined;

    status: BulkOperationStatus | null | undefined;
    type: BulkOperationAction | null | undefined;
    payload: Payload;

    failedCount: number;
    successCount: number;
}

function BulkActionItem(props: DownloadedItemProps) {
    const {
        createdDate,
        startedDate,
        completedDate,
        className,
        status,
        type,
        payload,
        failedCount,
        successCount,
    } = props;

    const statusText: {
        [key in BulkOperationStatus]: string;
    } = {
        PENDING: 'Bulk action should start soon.',
        STARTED: 'Bulk action has started.',
        FINISHED: 'Bulk action has completed.',
        CANCELED: 'Bulk action has been cancelled.',
        FAILED: 'Bulk action has failed.',
    };

    const figureRole = payload?.figureRole?.role ?? '?';

    if (type === 'FIGURE_ROLE') {
        return (
            <div
                className={_cs(styles.downloadItem, className)}
            >
                {status === 'PENDING' ? (
                    <div className={styles.exportItem}>
                        <span>
                            {`Change role of figure(s) to ${figureRole}`}
                        </span>
                    </div>
                ) : (
                    <div className={styles.exportItem}>
                        <span>
                            {status === 'FINISHED'
                                ? (`Change role of figure(s) to ${figureRole} completed on`)
                                : (`Change role of figure(s) to ${figureRole} started on`
                                )}
                        </span>
                        <DateTime
                            value={status === 'FINISHED' ? completedDate : startedDate}
                            format="datetime"
                        />
                    </div>
                )}
                <div className={_cs(styles.exportItem, styles.disabled)}>
                    {completedDate && startedDate && (
                        <span>
                            {`Bulk action took ${formatElapsedTime(diff(completedDate, startedDate))}.`}
                        </span>
                    )}
                    {startedDate && createdDate && (
                        <span>
                            {`Bulk action waited for ${formatElapsedTime(diff(startedDate, createdDate))}.`}
                        </span>
                    )}
                </div>
                {status !== 'FINISHED' && isDefined(status) && (
                    <div className={styles.status}>
                        <IoInformationCircleOutline className={styles.icon} />
                        <div className={styles.text}>
                            {statusText[status]}
                        </div>
                    </div>
                )}
                {status === 'FINISHED' && (
                    <div className={styles.actions}>
                        {successCount > 0 && `Saved ${successCount} figure(s).`}
                        {failedCount > 0 && `Failed to save ${failedCount} figure(s).`}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={_cs(styles.downloadItem, className)}
        >
            The bulk action is not implemented.
        </div>
    );
}

export default BulkActionItem;
