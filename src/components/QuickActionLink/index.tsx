import React from 'react';
import { LinkProps } from 'react-router-dom';
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
            name=""
            className={_cs(className, styles.quickActionLink)}
            childrenClassName={styles.children}
            {...otherProps}
        />
    );
}

export default QuickActionLink;
