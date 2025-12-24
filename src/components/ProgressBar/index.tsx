import React, { useMemo } from 'react';
import { _cs, isNotDefined } from '@togglecorp/fujs';

import styles from './styles.module.css';

export interface ProgressBarProps {
    className?: string;
    value: number;
    total: number | undefined | null;
    // eslint-disable-next-line max-len
    message?: string | ((value: number, totalValue: number | null | undefined) => (string | undefined));
    height?: number;
}

function ProgressBar(props: ProgressBarProps) {
    const {
        className,
        value,
        total,
        height = 12,
        message,
    } = props;

    const percentage = useMemo(() => {
        if (isNotDefined(total) || total <= 0) {
            return 0;
        }
        const safeValue = Math.min(value, total);
        return Math.round((safeValue / total) * 100);
    }, [value, total]);

    // eslint-disable-next-line no-nested-ternary
    const label = isNotDefined(message)
        ? undefined
        : typeof message === 'string'
            ? message
            : message(value, total);

    return (
        <div className={_cs(styles.progressBar, className)}>
            <div
                className={styles.track}
                style={{ height }}
            >
                <div
                    className={styles.bar}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {label && (
                <div className={styles.label}>
                    {label}
                </div>
            )}
        </div>
    );
}

export default ProgressBar;
