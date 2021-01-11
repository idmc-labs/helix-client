import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export interface StringCellProps {
    className?: string;
    value: string | undefined | null;
    tooltip?: string | undefined | null;
}

function StringCell(props: StringCellProps) {
    const {
        className,
        value,
        tooltip,
    } = props;

    return (
        <div
            className={_cs(styles.stringCell, className)}
            title={tooltip ?? value ?? ''}
        >
            { value }
        </div>
    );
}

export default StringCell;
