import React from 'react';
import { _cs } from '@togglecorp/fujs';

import SmartLink from '#components/SmartLink';
import { RouteData, Attrs } from '#hooks/useRouteMatching';

import Status, { ReviewStatus } from '../Status';
import SourceIndicators from '../SourceIndicators';
import styles from './styles.module.css';

export interface Props {
    className?: string;
    status: ReviewStatus | null | undefined;
    title?: string | null;
    route: RouteData;
    hash?: string;
    search?: string;
    attrs?: Attrs;
    fromHelixOne?: boolean;
    fromHulk?: boolean;
}

function StatusLink(props: Props) {
    const {
        className,
        status,
        title,
        route,
        attrs,
        fromHelixOne,
        fromHulk,
        hash,
        search,
    } = props;

    return (
        <div className={_cs(styles.statusLink, className)}>
            <SourceIndicators
                fromHelixOne={fromHelixOne}
                fromHulk={fromHulk}
            />
            <Status
                status={status}
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

export default StatusLink;
