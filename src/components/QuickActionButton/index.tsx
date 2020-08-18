import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { Button, ButtonProps } from '@togglecorp/toggle-ui';

import styles from './styles.css';

type RoundButtonProps = Omit<ButtonProps<string | number | undefined>, 'icons'>;

function QuickActionButton(props: RoundButtonProps) {
    const {
        className,
        ...otherProps
    } = props;

    return (
        <Button
            className={_cs(className, styles.button, styles.roundButton)}
            childrenClassName={styles.children}
            {...otherProps}
        />
    );
}

export default QuickActionButton;
