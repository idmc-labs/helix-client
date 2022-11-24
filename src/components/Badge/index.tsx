import React from 'react';
import { _cs, isNotDefined } from '@togglecorp/fujs';

import styles from './styles.css';

interface BadgeProps {
    count: number | null | undefined;
    className?: string;
}

function Badge(props: BadgeProps) {
    const {
        count,
        className,
    } = props;

    if (isNotDefined(count) || count === 0) {
        return null;
    }

    let text = String(count);
    if (count > 99) {
        text = '99+';
    }
    return (
        <span className={_cs(className, styles.badge)}>
            {text}
        </span>
    );
}

export default Badge;
