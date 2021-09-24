import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoCompass,
} from 'react-icons/io5';

import SmartLink from '#components/SmartLink';
import { RouteData, Attrs } from '#hooks/useRouteMatching';

import Status from '../Status';
import styles from './styles.css';

export interface Props {
    className?: string;
    isReviewed?: boolean | null | undefined;
    isSignedOff?: boolean | null | undefined;
    isUnderReview?: boolean | null | undefined;
    title?: string | null;
    route: RouteData;
    attrs?: Attrs;
    ext?: string;
}

function StatusLink(props: Props) {
    const {
        className,
        isReviewed,
        isSignedOff,
        isUnderReview,
        title,
        route,
        attrs,
        ext,
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
                    <IoCompass />
                </a>
            )}
            <Status
                isReviewed={isReviewed}
                isSignedOff={isSignedOff}
                isUnderReview={isUnderReview}
            />
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

export default StatusLink;
