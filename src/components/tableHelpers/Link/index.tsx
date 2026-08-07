import React from 'react';
import { _cs } from '@togglecorp/fujs';

import SmartLink from '#components/SmartLink';
import { RouteData, Attrs } from '#hooks/useRouteMatching';

import SourceIndicators from '../SourceIndicators';
import styles from './styles.module.css';

export interface LinkProps {
    title?: string | null;
    className?: string;
    route: RouteData;
    attrs?: Attrs;
    fromHelixOne?: boolean;
    hulkUuid?: string | null;
    hash?: string;
    search?: string;
}
function LinkCell(props: LinkProps) {
    const {
        title,
        route,
        attrs,
        className,
        fromHelixOne,
        hulkUuid,
        hash,
        search,
    } = props;

    return (
        <div className={_cs(className, styles.container)}>
            <SourceIndicators
                fromHelixOne={fromHelixOne}
                hulkUuid={hulkUuid}
            />
            <SmartLink
                className={_cs(styles.link, className)}
                route={route}
                attrs={attrs}
                hash={hash}
                search={search}
            >
                {title}
            </SmartLink>
        </div>
    );
}
export default LinkCell;
