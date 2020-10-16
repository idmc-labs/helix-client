import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export interface HeadingProps {
    className?: string;
    children?: React.ReactNode;
    size?: 'extraSmall' | 'small' | 'medium' | 'large';
}

function Heading(props: HeadingProps) {
    const {
        className,
        children,
        size = 'medium',
    } = props;

    return (
        <>
            {size === 'extraSmall' && (
                <h5 className={_cs(styles.heading, className)}>
                    { children }
                </h5>
            )}
            {size === 'small' && (
                <h4 className={_cs(styles.heading, className)}>
                    { children }
                </h4>
            )}
            {size === 'medium' && (
                <h3 className={_cs(styles.heading, className)}>
                    { children }
                </h3>
            )}
            {size === 'large' && (
                <h2 className={_cs(styles.heading, className)}>
                    { children }
                </h2>
            )}
        </>
    );
}

export default Heading;
