import React from 'react';
import {
    IoChevronForwardOutline,
    IoChevronDownOutline,
} from 'react-icons/io5';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface Props<N> {
    className?: string;
    header?: React.ReactNode;
    headerClassName?: string;
    children?: React.ReactNode;
    isExpanded?: boolean;
    name: N,
    onExpansionChange: (isExpanded: boolean, name: N) => void;
    elementRef?: React.RefObject<HTMLDivElement>;
    icons?: React.ReactNode;
    iconsClassName?: string;
    actions?: React.ReactNode;
    actionsClassName?: string;
    contentClassName?: string;
}

function CollapsibleContent<N>(props: Props<N>) {
    const {
        className,
        header,
        headerClassName,
        children,
        isExpanded,
        name,
        onExpansionChange,
        elementRef,
        icons,
        iconsClassName,
        actions,
        actionsClassName,
        contentClassName,
    } = props;

    const handleHeaderClick = React.useCallback(() => {
        if (onExpansionChange) {
            onExpansionChange(!isExpanded, name);
        }
    }, [onExpansionChange, name, isExpanded]);

    return (
        <div
            ref={elementRef}
            className={_cs(styles.collapsibleContent, className)}
        >
            <div // eslint-disable-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, max-len
                className={styles.headerContainer}
                onClick={handleHeaderClick}
            >
                {icons && (
                    <div className={_cs(styles.icons, iconsClassName)}>
                        {icons}
                    </div>
                )}
                <div className={_cs(styles.header, headerClassName)}>
                    {header}
                </div>
                <div className={_cs(styles.actions, actionsClassName)}>
                    {actions}
                    {isExpanded ? (
                        <IoChevronDownOutline className={styles.icon} />
                    ) : (
                        <IoChevronForwardOutline className={styles.icon} />
                    )}
                </div>

            </div>
            {isExpanded && (
                <div className={_cs(styles.children, contentClassName)}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default CollapsibleContent;
