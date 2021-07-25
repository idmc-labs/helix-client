import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Actions from '#components/Actions';
import { isChildNull } from '#utils/common';

import styles from './styles.css';

interface Props {
    className?: string;
    actionsContainerClassName?: string;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    contentClassName?: string;
}

function Footer(props: Props) {
    const {
        className,
        actionsContainerClassName,
        actions,
        contentClassName,
        children,
    } = props;

    if (isChildNull(children) && isChildNull(actions)) {
        return null;
    }

    return (
        <div className={_cs(className, styles.footer)}>
            {children && (
                <div className={_cs(contentClassName, styles.content)}>
                    { children }
                </div>
            )}
            {actions && (
                <Actions className={_cs(styles.actions, actionsContainerClassName)}>
                    { actions }
                </Actions>
            )}
        </div>
    );
}

export default Footer;
