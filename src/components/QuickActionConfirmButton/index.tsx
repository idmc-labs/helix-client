import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { ConfirmButton, ConfirmButtonProps } from '@togglecorp/toggle-ui';

import styles from './styles.css';

type RoundButtonProps<T extends string | number | undefined> = Omit<ConfirmButtonProps<T>, 'icons'>;

function QuickActionConfirmButton<T extends string | number | undefined>(
    props: RoundButtonProps<T>,
) {
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
