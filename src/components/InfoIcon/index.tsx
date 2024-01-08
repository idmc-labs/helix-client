import React from 'react';
import { _cs, isNotDefined } from '@togglecorp/fujs';
import { IoInformationCircleOutline } from 'react-icons/io5';

import Tooltip from '#components/Tooltip';

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

    if (isNotDefined(tooltip)) {
        return null;
    }

    return (
        <span
            className={_cs(styles.icon, className)}
            // title={tooltip}
        >
            <IoInformationCircleOutline />
            <Tooltip
                description={tooltip}
            />
        </span>
    );
}

export default InfoIcon;
