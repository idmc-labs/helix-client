import React, { useMemo } from 'react';
import { _cs, sum, isDefined, isNotDefined } from '@togglecorp/fujs';
import {
    IoSquare,
} from 'react-icons/io5';

import Tooltip from '#components/Tooltip';

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

    const totalSum = useMemo(
        () => (
            sum(data.map((item) => item.value).filter(isDefined))
        ), [data],
    );

    const avgResult = useMemo(
        () => (
            data.map(({ value, ...other }) => ({
                ...other,
                percentage: isDefined(value) && totalSum > 0
                    ? ((value / totalSum) * 100)
                    : undefined,
            }))
        ), [data, totalSum],
    );

    return (
        <div
            className={_cs(styles.progressWrapper, className)}
            style={{ height: `${barHeight}px` }}
        >
            <Tooltip
                description={(
                    <div className={styles.items}>
                        {data.map((datum) => (
                            <div className={styles.item}>
                                <IoSquare
                                    className={styles.icon}
                                    style={{ color: datum.color ?? 'transparent' }}
                                />
                                <div className={styles.title}>
                                    {datum.title}
                                </div>
                                <div className={styles.value}>
                                    {datum.value ?? 0}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            />
            {avgResult.map((item) => {
                if (isNotDefined(item.percentage) || item.percentage === 0) {
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
