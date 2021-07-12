import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

function NumberBlock({
    label,
    value,
    className,
}: {
    label: string;
    value: string | null | undefined;
    className?: string;
}) {
    return (
        <div className={_cs(styles.textBlock, className)}>
            <div className={styles.label}>
                {label}
            </div>
            <div className={styles.value}>
                {value ?? 'N/a'}
            </div>
        </div>
    );
}

export default NumberBlock;
