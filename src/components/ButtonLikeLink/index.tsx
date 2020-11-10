import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import {
    useButtonFeatures,
    VisualFeedback,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';

type PropsFromButton = Parameters<typeof useButtonFeatures>[0];
export interface ButtonLikeLinkProps extends PropsFromButton {
    className?: string;
    to: LinkProps['to'];
}

function ButtonLikeLink(props: ButtonLikeLinkProps) {
    const {
        to,
        ...buttonProps
    } = props;

    const {
        className,
        children,
    } = useButtonFeatures(buttonProps);

    return (
        <Link
            className={_cs(className, styles.buttonLikeLink)}
            to={to}
        >
            <VisualFeedback />
            { children }
        </Link>
    );
}

export default ButtonLikeLink;
