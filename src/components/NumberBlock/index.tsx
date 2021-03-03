import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { Numeral } from '@togglecorp/toggle-ui';

import styles from './styles.css';

function NumberBlock({
    label,
    value,
    className,
}: {
    label: string;
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
        </div>
    );
}

export default NumberBlock;
