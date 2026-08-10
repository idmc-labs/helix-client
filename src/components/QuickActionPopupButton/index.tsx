import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { PopupButton, PopupButtonProps } from '@togglecorp/toggle-ui';

import styles from './styles.module.css';

function QuickActionPopupButton<N extends string | number | undefined>(
    props: PopupButtonProps<N>,
) {
    const {
        className,
        arrowHidden = true,
        ...otherProps
    } = props;

    return (
        <PopupButton
            className={_cs(className, styles.button, styles.roundButton)}
            childrenClassName={styles.children}
            actionsClassName={styles.actions}
            arrowHidden={arrowHidden}
            {...otherProps}
        />
    );
}

export default QuickActionPopupButton;
