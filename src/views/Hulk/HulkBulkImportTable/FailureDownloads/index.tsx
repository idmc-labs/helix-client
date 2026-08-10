import React from 'react';
import { isDefined } from '@togglecorp/fujs';
import { IoDownloadOutline } from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionPopupButton from '#components/QuickActionPopupButton';
import ButtonLikeExternalLink from '#components/ButtonLikeExternalLink';
import { HulkBulkImportsListQuery } from '#generated/types';

import { DATASET_TYPE_ORDER, datasetTypeWord } from '../datasetTypes';
import styles from './styles.module.css';

function upperFirst(value: string) {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

type Dataset = NonNullable<NonNullable<NonNullable<
    HulkBulkImportsListQuery['hulkBulkImports']
>['results']>[number]['datasets']>[number];

export interface FailureDownloadsProps {
    className?: string;
    datasets: Dataset[] | null | undefined;
}

function FailureDownloads(props: FailureDownloadsProps) {
    const {
        className,
        datasets,
    } = props;

    const failed = DATASET_TYPE_ORDER
        .map((type) => datasets?.find((dataset) => dataset.importType === type))
        .filter(isDefined)
        .filter((dataset) => !!dataset.failureFile);

    if (failed.length === 0) {
        return null;
    }

    return (
        <Actions className={className}>
            <QuickActionPopupButton
                popupContentClassName={styles.popupContent}
                name={undefined}
                label={<IoDownloadOutline />}
                title="See failure details"
                transparent
                persistent={false}
            >
                {failed.map((dataset) => (
                    <ButtonLikeExternalLink
                        key={dataset.id}
                        className={styles.link}
                        link={dataset.failureFile ?? undefined}
                        icons={<IoDownloadOutline />}
                        transparent
                        compact
                    >
                        {`${upperFirst(datasetTypeWord(dataset.importType, 1))} failures (${dataset.failureCount ?? 0})`}
                    </ButtonLikeExternalLink>
                ))}
            </QuickActionPopupButton>
        </Actions>
    );
}

export default FailureDownloads;
