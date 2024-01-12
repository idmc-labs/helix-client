import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import { DateTime } from '@togglecorp/toggle-ui';
import { IoInformationCircleOutline } from 'react-icons/io5';

import { diff, formatElapsedTime } from '#utils/common';
import {
    Bulk_Operation_Status as BulkOperationStatus,
    BulkApiOperationFigureRolePayloadType,
} from '#generated/types';

import styles from './styles.css';

// TODO: refactor once confirm with server about file
interface DownloadedItemProps {
    className?: string;
    createdDate: string | null | undefined;
    startedDate: string | null | undefined;
    failedDate: string | null | undefined;
    completedDate: string | null | undefined;
    status: BulkOperationStatus | null | undefined;
    figureRole: NonNullable<BulkApiOperationFigureRolePayloadType>['role'] | undefined;
    totalFiguresCount: number;
    failedFiguresCount: number;
    successFiguresCount: number;
}

function BulkActionDownloadedItem(props: DownloadedItemProps) {
    const {
        createdDate,
        startedDate,
        failedDate,
        completedDate,
        className,
        status,
        figureRole,
        totalFiguresCount,
        failedFiguresCount,
        successFiguresCount,
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

    return (
        <div
            className={_cs(styles.downloadItem, className)}
        >
            {status === 'PENDING' && (
                <div className={styles.exportItem}>
                    <span>
                        {`Change role of figures to ${figureRole} triggered on`}
                    </span>
                    <DateTime
                        value={createdDate}
                        format="datetime"
                    />
                    <span>
                        {`${totalFiguresCount} pending`}
                    </span>
                </div>
            )}
            {status === 'STARTED' && (
                <div className={styles.exportItem}>
                    <span>
                        {`Change role of figures to ${figureRole} started on `}
                    </span>
                    <DateTime
                        value={startedDate}
                        format="datetime"
                    />
                    <div className={_cs(styles.exportItem, styles.disabled)}>
                        {createdDate && startedDate && (
                            <span>
                                {`Bulk action took ${formatElapsedTime(diff(createdDate, startedDate))}.`}
                            </span>
                        )}
                    </div>
                    <span>
                        {`${totalFiguresCount} pending`}
                    </span>
                </div>
            )}

            {(status === 'FAILED' || status === 'CANCELED') && (
                <div className={styles.exportItem}>
                    <span>
                        {`Change role of figures to ${figureRole} failed on `}
                    </span>
                    <DateTime
                        value={failedDate}
                        format="datetime"
                    />
                    <div className={_cs(styles.exportItem, styles.disabled)}>
                        {failedDate && startedDate && (
                            <span>
                                {`Bulk action took ${formatElapsedTime(diff(failedDate, startedDate))}.`}
                            </span>
                        )}
                    </div>
                    <span>
                        {`${failedFiguresCount} failed.`}
                    </span>
                </div>
            )}

            {status === 'FINISHED' && (
                <div className={styles.exportItem}>
                    <span>
                        {`Change role of figures to ${figureRole} completedDate on `}
                    </span>
                    <DateTime
                        value={completedDate}
                        format="datetime"
                    />
                    <div className={_cs(styles.exportItem, styles.disabled)}>
                        {completedDate && startedDate && (
                            <span>
                                {`Bulk action took ${formatElapsedTime(diff(completedDate, startedDate))}.`}
                            </span>
                        )}
                    </div>
                    <span>
                        {`${failedFiguresCount} failed. ${successFiguresCount} succeeded`}
                    </span>
                </div>
            )}

            {status !== 'FINISHED' && isDefined(status) && (
                <div className={styles.status}>
                    <IoInformationCircleOutline className={styles.icon} />
                    <div className={styles.text}>
                        {statusText[status]}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BulkActionDownloadedItem;
