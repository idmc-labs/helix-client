import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { BsPlusCircle } from 'react-icons/bs';

import { Button } from '@togglecorp/toggle-ui';

import styles from './styles.css';

type TrafficLightValue = 'RED' | 'GREEN' | 'GREY';

export interface TrafficLightInputProps<N> {
    className?: string;
    name: N;
    onChange?: (newValue: TrafficLightValue, name: N) => void;
    value: TrafficLightValue | undefined | null;
}

function TrafficLightInput<N extends string>(props: TrafficLightInputProps<N>) {
    const {
        className,
        value,
        name,
        onChange,
    } = props;

    const handleClick = React.useCallback((newValue) => {
        if (onChange) {
            onChange(newValue, name);
        }
    }, [name, onChange]);

    return (
        <div className={_cs(styles.trafficLightInput, className)}>
            <BsPlusCircle
                className={_cs(
                    value === 'GREEN' && styles.good,
                    value === 'RED' && styles.bad,
                )}
            />
            <div className={styles.actions}>
                <Button
                    className={styles.good}
                    name="GREEN"
                    onClick={handleClick}
                    transparent
                    compact
                >
                    <BsPlusCircle />
                </Button>
                <Button
                    name="GREY"
                    onClick={handleClick}
                    transparent
                    compact
                >
                    <BsPlusCircle />
                </Button>
                <Button
                    className={styles.bad}
                    name="RED"
                    onClick={handleClick}
                    transparent
                    compact
                >
                    <BsPlusCircle />
                </Button>
            </div>
        </div>
    );
}

export default TrafficLightInput;
