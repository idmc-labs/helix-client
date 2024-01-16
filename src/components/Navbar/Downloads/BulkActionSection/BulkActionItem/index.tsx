import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    Button,
    DateTime,
    useBooleanState,
} from '@togglecorp/toggle-ui';
import { IoInformationCircleOutline } from 'react-icons/io5';

import { diff, formatElapsedTime } from '#utils/common';
import {
    Bulk_Operation_Status as BulkOperationStatus,
    Bulk_Operation_Action as BulkOperationAction,
    BulkApiOperationsQuery,
} from '#generated/types';

import BulkActionSummary from './BulkActionSummary';
import styles from './styles.css';

type Payload = NonNullable<NonNullable<BulkApiOperationsQuery['bulkApiOperations']>['results']>[number]['payload'];

interface DownloadedItemProps {
    className?: string;
    id: string;
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
        id,
    } = props;

    const statusText: {
        [key in Exclude<BulkOperationStatus, 'COMPLETED'>]: string;
    } = {
        PENDING: 'Bulk action should start soon.',
        IN_PROGRESS: 'Bulk action has started.',
        KILLED: 'Bulk action has been aborted.',
        FAILED: 'Bulk action has failed.',
    };

    const figureRole = payload?.figureRole?.role ?? '?';

    const [
        detailsExpanded, , , ,
        toggleDetailsExpansion,
    ] = useBooleanState(false);

    if (type === 'FIGURE_ROLE') {
        return (
            <div
                className={_cs(styles.downloadItem, className)}
            >
                {status === 'PENDING' ? (
                    <div className={styles.exportItem}>
                        <span>
                            {`Change role of figures to ${figureRole}`}
                        </span>
                    </div>
                ) : (
                    <div className={styles.exportItem}>
                        <span>
                            {status === 'COMPLETED'
                                ? (`Change role of figures to ${figureRole} completed on`)
                                : (`Change role of figures to ${figureRole} started on`
                                )}
                        </span>
                        <DateTime
                            value={status === 'COMPLETED' ? completedDate : startedDate}
                            format="datetime"
                        />
                        {status === 'COMPLETED' && (
                            <>
                                {successCount > 0 && <span>{`Updated ${successCount} figures.`}</span>}
                                {failedCount > 0 && <span>{`Failed to update ${failedCount} figures.`}</span>}
                            </>
                        )}
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
                {status !== 'COMPLETED' && isDefined(status) && (
                    <div className={styles.status}>
                        <IoInformationCircleOutline className={styles.icon} />
                        <div className={styles.text}>
                            {statusText[status]}
                        </div>
                    </div>
                )}
                {status === 'COMPLETED' && (
                    <>
                        <div className={styles.actions}>
                            <Button
                                className={styles.detailsButton}
                                childrenClassName={styles.detailsButtonChildren}
                                name={undefined}
                                transparent
                                onClick={toggleDetailsExpansion}
                            >
                                {detailsExpanded ? 'Hide Details' : 'Show Details'}
                            </Button>
                        </div>
                        {detailsExpanded && (
                            <BulkActionSummary
                                id={id}
                            />
                        )}
                    </>
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
