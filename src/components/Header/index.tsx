import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface Props {
    className?: string;
    headingContainerClassName?: string;
    iconsContainerClassName?: string;
    actionsContainerClassName?: string;
    heading?: React.ReactNode;
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
}

function Header(props: Props) {
    const {
        className,
        headingContainerClassName,
        iconsContainerClassName,
        actionsContainerClassName,
        heading,
        actions,
        icons,
        size = 'medium',
    } = props;

    return (
        <div className={_cs(className, styles.header)}>
            { icons && (
                <div className={_cs(styles.icons, iconsContainerClassName)}>
                    { icons }
                </div>
            )}
            {size === 'small' && (
                <h4 className={_cs(styles.heading, headingContainerClassName)}>
                    { heading }
                </h4>
            )}
            {size === 'medium' && (
                <h3 className={_cs(styles.heading, headingContainerClassName)}>
                    { heading }
                </h3>
            )}
            {size === 'large' && (
                <h2 className={_cs(styles.heading, headingContainerClassName)}>
                    { heading }
                </h2>
            )}
            { actions && (
                <div className={_cs(styles.actions, actionsContainerClassName)}>
                    { actions }
                </div>
            )}
        </div>
    );
}

export default Header;
