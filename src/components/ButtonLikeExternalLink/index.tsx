import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    useButtonFeatures,
    VisualFeedback,
} from '@togglecorp/toggle-ui';

import ExternalLink from '#components/tableHelpers/ExternalLink';

import styles from './styles.css';

type PropsFromButton = Parameters<typeof useButtonFeatures>[0];
export interface ButtonLikeExternalLinkProps extends PropsFromButton {
    className?: string;
    title?: string;
    link?: string;
}

function ButtonLikeExternalLink(props: ButtonLikeExternalLinkProps) {
    const {
        title,
        link,
        ...buttonProps
    } = props;

    const {
        className,
        children,
    } = useButtonFeatures({
        children: title,
        ...buttonProps,
    });

    return (
        <ExternalLink
            className={_cs(className, styles.buttonLikeExternalLink)}
            link={link}
            title={(
                <>
                    <VisualFeedback />
                    {children}
                </>
            )}
        />
    );
}

export default ButtonLikeExternalLink;
