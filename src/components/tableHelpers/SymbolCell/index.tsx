import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoTriangle,
} from 'react-icons/io5';

import { Sources_Reliability as SourcesReliability } from '#generated/types';

import styles from './styles.css';

export interface SymbolCellProps {
    className?: string | null | undefined;
    sourcesData?: SourcesReliability | null | undefined;
}

function SymbolCell(props: SymbolCellProps) {
    const {
        className,
        sourcesData,
    } = props;

    return (
        <div className={_cs(styles.symbolDesign, className)}>
            {(sourcesData === 'LOW' || sourcesData === 'LOW_TO_MEDIUM') && (
                <IoTriangle
                    title={sourcesData}
                    style={{ color: 'var(--color-danger)' }}
                />
            )}
            {(sourcesData === 'MEDIUM' || sourcesData === 'MEDIUM_TO_HIGH' || sourcesData === 'LOW_TO_HIGH') && (
                <IoTriangle
                    title={sourcesData}
                    style={{ color: 'var(--color-warning)' }}
                />
            )}
            {sourcesData === 'HIGH' && (
                <IoTriangle
                    title={sourcesData}
                    style={{ color: 'var(--color-success' }}
                />
            )}
        </div>
    );
}
export default SymbolCell;
