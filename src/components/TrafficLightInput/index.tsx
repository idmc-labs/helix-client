import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { BsPlusCircle } from 'react-icons/bs';

import { Button } from '@togglecorp/toggle-ui';

import styles from './styles.css';

export interface TrafficLightInputProps<V, N> {
    className?: string;
    name: N;
    onChange: (newValue: V, name: N) => void;
    value: V;
}

function TrafficLightInput<V = string, N = string>(props: TrafficLightInputProps<V, N>) {
    const {
        className,
        value,
        name,
        onChange,
    } = props;

    const handleClick = React.useCallback((newValue) => {
        onChange(newValue, name);
    }, [name, onChange]);

    return (
        <div className={_cs(styles.trafficLightInput, className)}>
            <BsPlusCircle
                className={_cs(
                    styles.status,
                    value === 'good' && styles.good,
                    value === 'bad' && styles.bad,
                )}
            />
            <div className={styles.actions}>
                <Button
                    className={styles.good}
                    name="good"
                    onClick={handleClick}
                    transparent
                    compact
                >
                    <BsPlusCircle />
                </Button>
                <Button
                    className={styles.unassigned}
                    name={undefined}
                    onClick={handleClick}
                    transparent
                    compact
                >
                    <BsPlusCircle />
                </Button>
                <Button
                    className={styles.bad}
                    name="bad"
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
