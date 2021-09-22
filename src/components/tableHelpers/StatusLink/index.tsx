import React from 'react';
import { _cs } from '@togglecorp/fujs';

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
    } = props;

    return (
        <div className={_cs(styles.statusLink, className)}>
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
