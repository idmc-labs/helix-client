import React from 'react';
import { Link } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import { useButtonFeatures, ButtonProps } from '@togglecorp/toggle-ui';

import styles from './styles.css';

type PropsFromButton = Exclude<ButtonProps<string>, 'type'>;
interface ButtonLikeLinkProps extends PropsFromButton {
    className?: string;
    to: string;
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
            { children }
        </Link>
    );
}

export default ButtonLikeLink;
