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

const GOOD = 'GREEN';
const BAD = 'RED';

function TrafficLightInput<
    V extends string, N = string
>(props: TrafficLightInputProps<V, N>) {
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
                    value === GOOD && styles.good,
                    value === BAD && styles.bad,
                )}
            />
            <div className={styles.actions}>
                <Button
                    className={styles.good}
                    name={GOOD}
                    onClick={handleClick}
                    transparent
                    compact
                >
                    <BsPlusCircle />
                </Button>
                <Button
                    name={undefined}
                    onClick={handleClick}
                    transparent
                    compact
                >
                    <BsPlusCircle />
                </Button>
                <Button
                    className={styles.bad}
                    name={BAD}
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
