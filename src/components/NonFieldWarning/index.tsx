import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface NonFieldWarningProps {
    className?: string;
    children?: React.ReactNode;
}

function NonFieldWarning(props: NonFieldWarningProps) {
    const {
        className,
        children,
    } = props;

    if (!children) {
        return null;
    }

    return (
        <div className={_cs(className, styles.nonFieldWarning)}>
            { children }
        </div>
    );
}

export default NonFieldWarning;
