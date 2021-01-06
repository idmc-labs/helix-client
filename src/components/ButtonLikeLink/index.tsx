import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    useButtonFeatures,
    VisualFeedback,
} from '@togglecorp/toggle-ui';

import SmartLink from '#components/SmartLink';
import { RouteData, Attrs } from '#hooks/useRouteMatching';

import styles from './styles.css';

type PropsFromButton = Parameters<typeof useButtonFeatures>[0];
export interface ButtonLikeLinkProps extends PropsFromButton {
    className?: string;
    route: RouteData,
    attrs?: Attrs,
    title?: string;
}

function ButtonLikeLink(props: ButtonLikeLinkProps) {
    const {
        route,
        attrs,
        title,
        ...buttonProps
    } = props;

    const {
        className,
        children,
    } = useButtonFeatures(buttonProps);

    return (
        <SmartLink
            className={_cs(className, styles.buttonLikeLink)}
            route={route}
            attrs={attrs}
            title={title}
        >
            <VisualFeedback />
            { children }
        </SmartLink>
    );
}

export default ButtonLikeLink;
