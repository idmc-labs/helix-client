import React from 'react';
import { _cs, isTruthyString, isNotDefined } from '@togglecorp/fujs';

import styles from './styles.css';

export interface NumberProps {
    className?: string;
    value: number | undefined | null;
    tooltip?: string | undefined | null;
    placeholder?: string;
}

function Number(props: NumberProps) {
    const {
        className,
        value,
        tooltip,
        placeholder = '',
    } = props;

    const fallback = isTruthyString(placeholder)
        ? (
            <span className={styles.placeholder}>
                {placeholder}
            </span>
        )
        : null;

    if (isNotDefined(value)) {
        return fallback;
    }

    return (
        <>
            {value && (
                <div
                    className={_cs(styles.num, className)}
                    title={tooltip ?? ''}
                >
                    {value}
                </div>
            )}
        </>
    );
}

export default Number;
