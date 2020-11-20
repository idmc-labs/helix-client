import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface NonFieldErrorProps {
    className?: string;
    children?: React.ReactNode;
}

function NonFieldError(props: NonFieldErrorProps) {
    const {
        className,
        children,
    } = props;

    if (!children) {
        return null;
    }

    return (
        <div className={_cs(className, styles.nonFieldError)}>
            { children }
        </div>
    );
}

export default NonFieldError;
