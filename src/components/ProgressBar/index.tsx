import React from 'react';
import { _cs } from '@togglecorp/fujs';
import styles from './styles.css';

interface ProgressProps {
    className?: string;
    first: number;
    second: number;
    // TODO: add props: three, four
    // TODO: any of them can be null or undefined
    // TODO: sum of all can be null or undefined or zero
    // TODO: prop to change the height of the progress bar
}

function ProgressBar(props: ProgressProps) {
    const {
        className,
        first,
        second,
    } = props;

    const total = first + second;

    const firstPercent = (first / total) * 100;
    const secondPercent = (second / total) * 100;

    return (
        <div
            className={_cs(styles.progressWrapper, className)}
            title={`First: ${first}\nSecond: ${second}`}
        >
            <div
                className={_cs(styles.dataFirst, styles.data)}
                style={{ width: `${firstPercent}%` }}
            />
            <div
                className={_cs(styles.dataSecond, styles.data)}
                style={{ width: `${secondPercent}%` }}
            />
        </div>
    );
}
export default ProgressBar;
