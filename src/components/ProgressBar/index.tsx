import React, { useMemo } from 'react';
import { _cs, sum, isDefined } from '@togglecorp/fujs';
import styles from './styles.css';

interface ProgressProps {
    className?: string | null | undefined;
    barHeight: number;
    data: {
        title: string | undefined | null,
        color: string | undefined | null,
        value: number | undefined | null,
    }[]
    // TODO: sum of all can be null or undefined or zero
    // TODO: prop to change the height of the progress bar
}

function ProgressBar(props: ProgressProps) {
    const {
        className,
        barHeight,
        data,
    } = props;

    const totalSum = sum(data.map((item) => item.value).filter(isDefined));
    const avgResult = data.map(({ value, ...other }) => ({
        ...other,
        // eslint-disable-next-line max-len
        percentage: isDefined(value) && totalSum > 0 ? ((value / totalSum) * 100).toFixed(1) : undefined,
    }));
    console.log('Average result::>>', avgResult);

    return (
        <div
            className={_cs(styles.progressWrapper, className)}
            title={`${avgResult[0].title}: ${avgResult[0].percentage}\n${avgResult[1].title}: ${avgResult[1].percentage}\n${avgResult[2].title}: ${avgResult[2].percentage}\n${avgResult[3].title}: ${avgResult[3].percentage}`}
            style={{ height: `${barHeight}px` }}
        >
            {avgResult.map((item) => (
                <div
                    className={_cs(styles.dataFirst, styles.data)}
                    style={{ width: `${item.percentage}%`, backgroundColor: `${item.color}` }}
                />
            ))}
        </div>
    );
}
export default ProgressBar;
