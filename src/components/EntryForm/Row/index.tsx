import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface RowProps {
    className?: string;
    children: React.ReactNode;
    singleColumnNoGrow?: boolean,
}

function Row(props: RowProps) {
    const {
        className,
        children,
        singleColumnNoGrow,
    } = props;
    return (
        <div className={
            _cs(
                className,
                styles.row,
                singleColumnNoGrow && styles.singleColumnNoGrow,
            )
        }
        >
            { children }
        </div>
    );
}

export default Row;
