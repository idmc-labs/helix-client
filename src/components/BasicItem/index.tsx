import React from 'react';

import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface BasicItemProps {
    children: React.ReactNode;
    actions?: React.ReactNode;
    selected?: boolean;
    className?: string;
}

function BasicItem(props: BasicItemProps) {
    const {
        className,
        children,
        actions,
        selected,
    } = props;

    return (
        <div
            className={_cs(
                className,
                styles.itemRow,
                selected && styles.selected,
            )}
        >
            {children}
            {!!actions && (
                <div className={styles.actionButtons}>
                    {actions}
                </div>
            )}
        </div>
    );
}

export default BasicItem;
