import React from 'react';
import { _cs, sum, isDefined } from '@togglecorp/fujs';

import ExternalLink from '#components/tableHelpers/ExternalLink';
import { HulkBulkImportsListQuery } from '#generated/types';

import { DATASET_TYPE_ORDER, datasetTypeTitle } from '../datasetTypes';
import Bar, { BarSegment } from './Bar';
import styles from './styles.module.css';

type Dataset = NonNullable<NonNullable<NonNullable<
    HulkBulkImportsListQuery['hulkBulkImports']
>['results']>[number]['datasets']>[number];

// Each status is one segment of an entity's composition bar; the segment
// width is proportional to its count, tinted by the status tone.
interface Segment {
    key: string;
    label: string;
    tone: 'success' | 'warning' | 'danger';
    count: (dataset: Dataset) => number;
    file: (dataset: Dataset) => string | null | undefined;
}

const SEGMENTS: Segment[] = [
    {
        key: 'success',
        label: 'Success',
        tone: 'success',
        count: (dataset) => dataset.successCount ?? 0,
        file: (dataset) => dataset.successFile,
    },
    {
        key: 'skip',
        label: 'Skipped',
        tone: 'warning',
        count: (dataset) => dataset.skipCount ?? 0,
        file: (dataset) => dataset.skipFile,
    },
    {
        key: 'failure',
        label: 'Failure',
        tone: 'danger',
        count: (dataset) => dataset.failureCount ?? 0,
        file: (dataset) => dataset.failureFile,
    },
];

function datasetTotal(dataset: Dataset) {
    return sum([
        dataset.successCount ?? 0,
        dataset.skipCount ?? 0,
        dataset.failureCount ?? 0,
    ]);
}

interface DatasetMatrixProps {
    className?: string;
    datasets: Dataset[] | null | undefined;
    // Counts are only written once the import finishes, so a placeholder is
    // shown instead of a misleading zero.
    pending?: boolean;
}

function DatasetMatrix(props: DatasetMatrixProps) {
    const {
        className,
        datasets,
        pending,
    } = props;

    // Only entity types that were actually part of the import get a row; a
    // type with no dataset is skipped entirely. Order follows DATASET_TYPE_ORDER.
    const orderedDatasets = [...(datasets ?? [])].sort(
        (a, b) => DATASET_TYPE_ORDER[a.importType] - DATASET_TYPE_ORDER[b.importType],
    );

    // The summary bar shows each status as a share of the whole import.
    const grandTotal = sum(orderedDatasets.map(datasetTotal));

    const summarySegments = SEGMENTS
        .map((segment): BarSegment | undefined => {
            const segmentSum = sum(orderedDatasets.map((dataset) => segment.count(dataset)));
            if (segmentSum <= 0) {
                return undefined;
            }
            const percentage = grandTotal > 0
                ? Math.round((segmentSum / grandTotal) * 1000) / 10
                : 0;
            return {
                key: segment.key,
                tone: segment.tone,
                grow: segmentSum,
                content: `${percentage}%`,
            };
        })
        .filter(isDefined);

    return (
        <div className={_cs(className, styles.datasetMatrix)}>
            <table className={styles.matrix}>
                <tbody>
                    {orderedDatasets.map((dataset) => {
                        const { importFile } = dataset;
                        const segments = SEGMENTS
                            .map((segment): BarSegment | undefined => {
                                const count = segment.count(dataset);
                                // A zero status contributes no segment.
                                if (count <= 0) {
                                    return undefined;
                                }
                                return {
                                    key: segment.key,
                                    tone: segment.tone,
                                    grow: count,
                                    content: String(count),
                                    // The whole segment downloads its file.
                                    link: segment.file(dataset),
                                };
                            })
                            .filter(isDefined);
                        return (
                            <tr key={dataset.importType}>
                                <th scope="row" className={styles.label}>
                                    {/* The label downloads the whole import file. */}
                                    <ExternalLink
                                        className={importFile ? styles.link : undefined}
                                        title={datasetTypeTitle(dataset.importType)}
                                        link={importFile}
                                    />
                                </th>
                                <td className={styles.barCell}>
                                    <Bar pending={pending} segments={segments} />
                                </td>
                                <td className={styles.total}>
                                    {pending ? '...' : datasetTotal(dataset)}
                                </td>
                            </tr>
                        );
                    })}
                    <tr className={styles.summary}>
                        <td className={styles.label} aria-label="Overall" />
                        <td className={styles.barCell}>
                            <Bar pending={pending} segments={summarySegments} />
                        </td>
                        <td className={styles.total} aria-label="Overall total" />
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default DatasetMatrix;
