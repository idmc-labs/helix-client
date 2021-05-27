import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoInformationCircleSharp } from 'react-icons/io5';

import styles from './styles.css';

export interface IconProps {
    className?: string;
    tooltip?: string | undefined | null;
}

function InfoIcon(props: IconProps) {
    const {
        className,
        tooltip,
    } = props;

    return (
        <div
            className={_cs(styles.icon, className)}
            title={tooltip ?? ''}
        >
            <IoInformationCircleSharp />
        </div>
    );
}

export default InfoIcon;
