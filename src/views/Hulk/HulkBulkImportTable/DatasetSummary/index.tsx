import React from 'react';
import { _cs, sum } from '@togglecorp/fujs';

import { HulkBulkImportsListQuery } from '#generated/types';

import { DATASET_TYPE_ORDER, datasetTypeWord } from '../datasetTypes';
import styles from './styles.module.css';

type Dataset = NonNullable<NonNullable<NonNullable<
    HulkBulkImportsListQuery['hulkBulkImports']
>['results']>[number]['datasets']>[number];

export interface DatasetSummaryProps {
    className?: string;
    datasets: Dataset[] | null | undefined;
    // Counts are only written once the import finishes, so a placeholder is
    // shown instead of a misleading zero.
    pending?: boolean;
}

function DatasetSummary(props: DatasetSummaryProps) {
    const {
        className,
        datasets,
        pending,
    } = props;

    const ordered = [...(datasets ?? [])].sort(
        (a, b) => DATASET_TYPE_ORDER[a.importType] - DATASET_TYPE_ORDER[b.importType],
    );

    if (ordered.length === 0) {
        return null;
    }

    if (pending) {
        return (
            <div className={_cs(className, styles.summary)}>
                ...
            </div>
        );
    }

    return (
        <div className={_cs(className, styles.summary)}>
            {ordered.map((dataset, index) => {
                const total = sum([
                    dataset.successCount ?? 0,
                    dataset.failureCount ?? 0,
                    dataset.skipCount ?? 0,
                ]);
                return (
                    <React.Fragment key={dataset.id}>
                        {index > 0 && <span className={styles.separator}>,</span>}
                        <span className={styles.entry}>
                            {`${total} ${datasetTypeWord(dataset.importType, total)}`}
                        </span>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default DatasetSummary;
