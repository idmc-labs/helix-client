import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface Props {
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    title?: React.ReactNode;
    titleClassName?: string;
    headerRightComponent?: React.ReactNode;
    headerRightComponentClassName?: string;
    children: React.ReactNode;
}

function Card(props: Props) {
    const {
        className,
        children,
        headerClassName,
        headerRightComponent,
        headerRightComponentClassName,
        contentClassName,
        titleClassName,
        title,
    } = props;

    return (
        <div className={_cs(styles.card, className)}>
            <div className={_cs(styles.header, headerClassName)}>
                <h3 className={_cs(styles.title, titleClassName)}>
                    {title}
                </h3>
                <div className={_cs(styles.headerRight, headerRightComponentClassName)}>
                    {headerRightComponent}
                </div>
            </div>
            <div className={_cs(styles.content, contentClassName)}>
                {children}
            </div>
        </div>
    );
}

Card.defaultProps = {
    className: undefined,
    headerClassName: undefined,
    contentClassName: undefined,
    headerRightComponentClassName: undefined,
    title: undefined,
    titleClassName: undefined,
    headerRightComponent: undefined,
};

export default Card;
