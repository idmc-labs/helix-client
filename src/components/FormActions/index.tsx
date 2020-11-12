import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface Props {
    className?: string;
    children?: React.ReactNode;
}

function FormActions(props: Props) {
    const {
        className,
        children,
    } = props;

    return (
        <div className={_cs(className, styles.formActions)}>
            { children }
        </div>
    );
}

export default FormActions;
