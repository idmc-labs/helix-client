import React, { useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.module.css';

export interface ProgressBarProps {
    className?: string;
    value: number;
    total: number | undefined | null;
    height?: number;
    label?: string;
}

function ProgressBar(props: ProgressBarProps) {
    const {
        className,
        value,
        total,
        height = 12,
        label,
    } = props;

    const percentage = useMemo(() => {
        if (!total || total <= 0) {
            return 0;
        }
        const safeFetched = Math.min(value, total);
        return Math.round((safeFetched / total) * 100);
    }, [value, total]);

    if (!total) {
        return null;
    }

    return (
        <div className={_cs(styles.wrapper, className)}>
            <div
                className={styles.track}
                style={{ height }}
            >
                <div
                    className={styles.bar}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className={styles.label}>
                {label}
                {value}
                /
                {total}
            </div>
        </div>
    );
}

export default ProgressBar;
