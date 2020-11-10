import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ButtonLikeLink, { ButtonLikeLinkProps } from '#components/ButtonLikeLink';

import styles from './styles.css';

type QuickActionProps = ButtonLikeLinkProps;

function QuickActionLink(props: QuickActionProps) {
    const {
        className,
        ...otherProps
    } = props;

    return (
        <ButtonLikeLink
            className={_cs(className, styles.quickActionLink)}
            childrenClassName={styles.children}
            {...otherProps}
        />
    );
}

export default QuickActionLink;
