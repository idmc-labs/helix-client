import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { BsPlusCircle } from 'react-icons/bs';

import styles from './styles.css';

export interface TrafficLightInputProps {
    className?: string;
}

function TrafficLightInput(props: TrafficLightInputProps) {
    const {
        className,
    } = props;

    return (
        <div className={_cs(styles.trafficLightInput, className)}>
            <BsPlusCircle />
        </div>
    );
}

export default TrafficLightInput;
