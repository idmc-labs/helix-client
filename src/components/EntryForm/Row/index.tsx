import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

const styleMap = {
    oneColumn: styles.oneColumn,
    twoColumn: styles.twoColumn,
    threeColumn: styles.threeColumn,
};

interface RowProps {
    className?: string;
    mode?: 'oneColumn' | 'twoColumn' | 'threeColumn';
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
