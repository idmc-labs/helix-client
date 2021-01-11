import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export interface StringCellProps {
    className?: string;
    value: string | undefined | null;
    tooltip?: string;
}

function StringCell(props: StringCellProps) {
    const {
        className,
        value,
        tooltip = value ?? '' as string,
    } = props;

    return (
        <div
            className={_cs(styles.stringCell, className)}
            title={tooltip}
        >
            { value }
        </div>
    );
}

export default StringCell;
