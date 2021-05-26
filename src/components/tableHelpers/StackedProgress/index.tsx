import React, { useMemo, memo } from 'react';
import { _cs } from '@togglecorp/fujs';
import ProgressBar from '#components/ProgressBar';

import styles from './styles.css';

export interface StackedProgressProps {
    className?: string;
    barHeight?: number;

    signedOff: number | null | undefined;
    reviewCompleted: number | null | undefined;
    underReview: number | null | undefined;
    toBeReviewed: number | null | undefined;
}

function StackedProgress(props: StackedProgressProps) {
    const {
        className,
        barHeight = 10,
        signedOff,
        reviewCompleted,
        underReview,
        toBeReviewed,
    } = props;

    const data = useMemo(
        () => [
            {
                title: 'Signed Off',
                color: 'var(--color-success)',
                value: signedOff,
            },
            {
                title: 'Review Completed',
                color: 'var(--color-accent)',
                value: reviewCompleted,
            },
            {
                title: 'Under Review',
                color: 'var(--color-warning)',
                value: underReview,
            },
            {
                title: 'To be Reviewed',
                color: 'var(--color-danger)',
                value: toBeReviewed,
            },
        ],
        [signedOff, reviewCompleted, underReview, toBeReviewed],
    );

    return (
        <div
            className={_cs(styles.stackedProgress, className)}
        >
            <ProgressBar
                barHeight={barHeight}
                data={data}
            />
        </div>
    );
}

export default memo(StackedProgress);
