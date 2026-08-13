import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';

import { HulkBulkImportsListQuery } from '#generated/types';

import { DATASET_TYPE_ORDER, datasetTypeWord } from '../datasetTypes';
import styles from './styles.module.css';

type Dataset = NonNullable<NonNullable<NonNullable<
    HulkBulkImportsListQuery['hulkBulkImports']
>['results']>[number]['datasets']>[number];

export interface DatasetImportLinksProps {
    className?: string;
    datasets: Dataset[] | null | undefined;
}

function DatasetImportLinks(props: DatasetImportLinksProps) {
    const {
        className,
        datasets,
    } = props;

    const ordered = DATASET_TYPE_ORDER
        .map((type) => datasets?.find((dataset) => dataset.importType === type))
        .filter(isDefined);

    if (ordered.length === 0) {
        return null;
    }

    return (
        <div className={_cs(className, styles.imports)}>
            {ordered.map((dataset, index) => {
                const total = (dataset.successCount ?? 0) + (dataset.failureCount ?? 0);
                const label = `${total} ${datasetTypeWord(dataset.importType, total)}`;
                return (
                    <React.Fragment key={dataset.id}>
                        {index > 0 && <span className={styles.separator}>,</span>}
                        {dataset.importFile ? (
                            <a
                                className={styles.link}
                                href={dataset.importFile}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {label}
                            </a>
                        ) : (
                            <span>{label}</span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export default DatasetImportLinks;
