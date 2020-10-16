import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { ConfirmButton, ConfirmButtonProps } from '@togglecorp/toggle-ui';

import styles from './styles.css';

type RoundButtonProps = Omit<ConfirmButtonProps<string | number | undefined>, 'icons'>;

function QuickActionConfirmButton(props: RoundButtonProps) {
    const {
        className,
        ...otherProps
    } = props;

    return (
        <ConfirmButton
            className={_cs(className, styles.button, styles.roundButton)}
            childrenClassName={styles.children}
            {...otherProps}
        />
    );
}

export default QuickActionConfirmButton;
