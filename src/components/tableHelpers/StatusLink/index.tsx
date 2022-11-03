import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoCompassOutline,
} from 'react-icons/io5';

import SmartLink from '#components/SmartLink';
import { RouteData, Attrs } from '#hooks/useRouteMatching';

import Status, { ReviewStatus } from '../Status';
import styles from './styles.css';

export interface Props {
    className?: string;
    status: ReviewStatus | null | undefined;
    title?: string | null;
    route: RouteData;
    hash?: string;
    search?: string;
    attrs?: Attrs;
    ext?: string;
}

function StatusLink(props: Props) {
    const {
        className,
        status,
        title,
        route,
        attrs,
        ext,
        hash,
        search,
    } = props;

    return (
        <div className={_cs(styles.statusLink, className)}>
            {ext && (
                <a
                    className={styles.ext}
                    title={ext}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://helix.idmcdb.org${ext}`}
                >
                    <IoCompassOutline />
                </a>
            )}
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
