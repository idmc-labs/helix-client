import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface Props {
    className?: string;
    actionsContainerClassName?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    contentClassName?: string;
}

function Header(props: Props) {
    const {
        className,
        actionsContainerClassName,
        actions,
        contentClassName,
        children,
    } = props;

    return (
        <div className={_cs(className, styles.footer)}>
            <div className={_cs(contentClassName, styles.content)}>
                { children }
            </div>
            { actions && (
                <div className={_cs(styles.actions, actionsContainerClassName)}>
                    { actions }
                </div>
            )}
        </div>
    );
}

export default Header;
