import React from 'react';
import { _cs, sum, isDefined, isNotDefined } from '@togglecorp/fujs';
import styles from './styles.css';

export interface ProgressBarProps {
    className?: string | null | undefined;
    barHeight: number;
    data: {
        title: string | undefined | null,
        color: string | undefined | null,
        value: number | undefined | null,
    }[];
}

function ProgressBar(props: ProgressBarProps) {
    const {
        className,
        barHeight,
        data,
    } = props;

    const totalSum = sum(data.map((item) => item.value).filter(isDefined));

    const avgResult = data.map(({ value, ...other }) => ({
        ...other,
        percentage: isDefined(value) && totalSum > 0
            ? ((value / totalSum) * 100).toFixed(2)
            : undefined,
    }));

    const tooltip = data.map((datum) => `${datum.title}: ${datum.value ?? 0}`).join('\n');

    return (
        <div
            className={_cs(styles.progressWrapper, className)}
            style={{ height: `${barHeight}px` }}
            title={tooltip}
        >
            {avgResult.map((item) => {
                if (isNotDefined(item.percentage)) {
                    return null;
                }
                return (
                    <div
                        key={item.title}
                        className={styles.data}
                        style={{ width: `${item.percentage}%`, backgroundColor: `${item.color}` }}
                    />
                );
            })}
        </div>
    );
}
export default ProgressBar;
