import React, { useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

export type TagVariant = (
    'default'
    | 'accent'
    | 'success'
    | 'danger'
    | 'warning'
    | 'primary'
)

const tagVariantToClassName: {
    [key in TagVariant]: string;
} = {
    default: styles.default,
    accent: styles.accent,
    success: styles.success,
    danger: styles.danger,
    warning: styles.warning,
    primary: styles.primary,
};

export interface Props {
    className?: string;
    variant?: TagVariant;
    actions?: React.ReactNode;
    icons?: React.ReactNode;
    children?: React.ReactNode;
    iconsContainerClassName?: string;
    actionsContainerClassName?: string;
    childrenContainerClassName?: string;
    prettify?: boolean;
}

function Tag(props: Props) {
    const {
        className,
        icons,
        actions,
        children,
        variant = 'default',
        iconsContainerClassName,
        actionsContainerClassName,
        childrenContainerClassName,
        prettify = false,
    } = props;

    const modifiedChildren = useMemo(() => {
        if (typeof children === 'string' && prettify) {
            return children.replace(/_|-|\\. /g, ' ').toLowerCase();
        }
        return children;
    }, [prettify, children]);

    return (
        <div
            className={_cs(
                className,
                styles.tag,
                tagVariantToClassName[variant],
            )}
        >
            {icons && (
                <div className={_cs(styles.iconContainer, iconsContainerClassName)}>
                    {icons}
                </div>
            )}
            {modifiedChildren && (
                <div
                    className={_cs(
                        styles.childrenContainer,
                        childrenContainerClassName,
                        prettify && styles.pretty,
                    )}
                >
                    {modifiedChildren}
                </div>
            )}
            {actions && (
                <div className={_cs(styles.actionsContainer, actionsContainerClassName)}>
                    {actions}
                </div>
            )}
        </div>
    );
}

export default Tag;
