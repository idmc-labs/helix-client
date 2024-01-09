import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { Numeral } from '@togglecorp/toggle-ui';

import styles from './styles.css';

function NumberBlock({
    label,
    value,
    description,
    className,
}: {
    label: React.ReactNode;
    description?: React.ReactNode;
    value: number | null | undefined;
    className?: string;
}) {
    return (
        <div className={_cs(styles.numberBlock, className)}>
            <div className={styles.label}>
                { label }
            </div>
            <Numeral
                className={styles.value}
                value={value}
                placeholder="N/a"
            />
            {description && (
                <div className={styles.description}>
                    {description}
                </div>
            )}
        </div>
    );
}

export default NumberBlock;
