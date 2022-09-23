import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoTriangle,
} from 'react-icons/io5';
import styles from './styles.css';

export interface SymbolCellProps {
    className?: string | null | undefined;
}

function SymbolCell(props: SymbolCellProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.symbolDesign, className)}>
            <IoTriangle />
        </div>
    );
}
export default SymbolCell;
