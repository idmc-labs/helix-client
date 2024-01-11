import React, { useMemo, memo } from 'react';
import { _cs } from '@togglecorp/fujs';
import ProgressBar from '#components/ProgressBar';

import styles from './styles.css';

export interface StackedProgressProps {
    className?: string;
    barHeight?: number;

    approved?: number | null | undefined;
    inProgress?: number | null | undefined;
    notStarted?: number | null | undefined;
    reRequested?: number | null | undefined;
}

function StackedProgress(props: StackedProgressProps) {
    const {
        className,
        barHeight = 10,
        approved,
        inProgress,
        notStarted,
        reRequested,
    } = props;

    const data = useMemo(
        () => [
            {
                title: 'Approved',
                // FIXME: We should use a different color/color-name
                color: 'var(--color-disaster)',
                value: approved,
            },
            {
                title: 'Re-requested',
                color: 'var(--color-primary)',
                value: reRequested,
            },
            {
                title: 'In Progress',
                color: 'var(--color-warning)',
                value: inProgress,
            },
            {
                title: 'To be Reviewed',
                color: 'var(--tui-color-background-input-section-light)',
                value: notStarted,
            },
        ],
        [approved, inProgress, notStarted, reRequested],
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
