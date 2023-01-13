import React from 'react';

import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface BasicItemProps {
    children: React.ReactNode;
    actions?: React.ReactNode;
    selected?: boolean;
    className?: string;
}

/*
 * Basic item with a name and hover-able actions
 * Also has a selected state
 */
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
                styles.basicItem,
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
