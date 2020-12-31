import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

const styleMap = {
    oneColumn: undefined,
    twoColumn: styles.twoColumn,
    threeColumn: styles.threeColumn,
    fourColumn: styles.fourColumn,
    oneColumnNoGrow: styles.oneColumnNoGrow,
};

interface RowProps {
    className?: string;
    mode?: 'oneColumn' | 'twoColumn' | 'threeColumn' | 'oneColumnNoGrow' | 'fourColumn';
    children: React.ReactNode;
}

function Row(props: RowProps) {
    const {
        className,
        mode = 'oneColumn',
        children,
    } = props;
    return (
        <div className={_cs(className, styles.row, styleMap[mode])}>
            { children }
        </div>
    );
}

export default Row;
