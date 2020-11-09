import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';

import ButtonLikeLink from '#components/ButtonLikeLink';

import styles from './styles.css';

interface QuickActionProps extends LinkProps {
    className?: string;
}

function QuickActionLink(props: QuickActionProps) {
    const {
        className,
        ...otherProps
    } = props;

    return (
        <ButtonLikeLink
            className={_cs(className, styles.quickActionLink)}
            {...otherProps}
        />
    );
}

export default QuickActionLink;
