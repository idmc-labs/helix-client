import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoTriangle,
} from 'react-icons/io5';
import styles from './styles.css';

const low = 'Low';
const high = 'High';
const medium = 'Medium';
const highToLow = 'High to Low';

export interface SymbolCellProps {
    className?: string | null | undefined;
    sourcesData?: string | null | undefined;
}

function SymbolCell(props: SymbolCellProps) {
    const {
        className,
        sourcesData,
    } = props;

    return (
        <div className={_cs(styles.symbolDesign, className)}>
            {sourcesData === low && <IoTriangle style={{ color: 'green' }} />}
            {(sourcesData === medium || sourcesData === highToLow) && <IoTriangle style={{ color: 'purple' }} />}
            {sourcesData === high && <IoTriangle style={{ color: 'red' }} />}
        </div>
    );
}
export default SymbolCell;
