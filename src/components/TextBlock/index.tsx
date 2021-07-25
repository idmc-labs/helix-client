import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

function TextBlock({
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
            {value ? (
                <div className={styles.value}>
                    {value}
                </div>
            ) : (
                <div className={styles.na}>
                    N/a
                </div>
            )}
        </div>
    );
}

export default TextBlock;
