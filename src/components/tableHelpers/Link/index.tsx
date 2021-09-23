import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoCompass,
} from 'react-icons/io5';

import SmartLink from '#components/SmartLink';
import { RouteData, Attrs } from '#hooks/useRouteMatching';

import styles from './styles.css';

export interface LinkProps {
    title?: string | null;
    className?: string;
    route: RouteData;
    attrs?: Attrs;
    ext?: string;
}
function LinkCell(props: LinkProps) {
    const {
        title,
        route,
        attrs,
        className,
        ext,
    } = props;

    return (
        <div className={_cs(className, styles.container)}>
            {ext && (
                <a
                    className={styles.ext}
                    title={ext}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://helix.idmcdb.org${ext}`}
                >
                    <IoCompass />
                </a>
            )}
            <SmartLink
                className={_cs(styles.link, className)}
                route={route}
                attrs={attrs}
            >
                {title}
            </SmartLink>
        </div>
    );
}
export default LinkCell;
