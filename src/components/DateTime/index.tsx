import React from 'react';
import {
    DateTimeProps,
    DateTime as ActualDateTime,
} from '@togglecorp/toggle-ui';
import { _cs, isNotDefined } from '@togglecorp/fujs';

import { getDateFromDateString } from '#utils/common';
import Tooltip from '#components/Tooltip';

import styles from './styles.css';

type Props = DateTimeProps;

export function formatYearMonthLong(value: undefined): undefined
export function formatYearMonthLong(value: string | undefined): string | undefined
export function formatYearMonthLong(value: string): string
export function formatYearMonthLong(value: Date): string
export function formatYearMonthLong(value: Date | string | null | undefined) {
    if (isNotDefined(value)) {
        return undefined;
    }
    let date: Date;
    if (typeof value === 'string') {
        date = getDateFromDateString(value);
    } else {
        date = value;
    }
    return date.toLocaleString(
        'default',
        {
            year: 'numeric',
            month: 'short',
        },
    );
}

export function formatDateLong(value: undefined): undefined
export function formatDateLong(value: string | undefined): string | undefined
export function formatDateLong(value: string): string
export function formatDateLong(value: Date): string
export function formatDateLong(value: Date | string | null | undefined) {
    if (isNotDefined(value)) {
        return undefined;
    }
    let date: Date;
    if (typeof value === 'string') {
        date = getDateFromDateString(value);
    } else {
        date = value;
    }
    return date.toLocaleString(
        'default',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        },
    );
}

export function formatDate(value: undefined): undefined
export function formatDate(value: string | undefined): string | undefined
export function formatDate(value: string): string
export function formatDate(value: Date): string
export function formatDate(value: Date | string | null | undefined) {
    if (isNotDefined(value)) {
        return undefined;
    }
    let date: Date;
    if (typeof value === 'string') {
        date = getDateFromDateString(value);
    } else {
        date = value;
    }
    return date.toLocaleString(
        'default',
        {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        },
    );
}

export function formatDateTimeLong(value: undefined): undefined
export function formatDateTimeLong(value: string | undefined): string | undefined
export function formatDateTimeLong(value: string): string
export function formatDateTimeLong(value: Date): string
export function formatDateTimeLong(value: Date | string | null | undefined) {
    if (isNotDefined(value)) {
        return undefined;
    }

    let date: Date;
    if (typeof value === 'string') {
        // FIXME: do no use new Date directly
        date = new Date(value);
    } else {
        date = value;
    }
    return date.toLocaleString(
        'default',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        },
    );
}

function DateTime(props: Props) {
    const {
        className,
        value,
        format,
    } = props;

    let tooltipContent;
    if (value && format === 'date') {
        tooltipContent = formatDateLong(value);
    } else if (value && format === 'datetime') {
        tooltipContent = formatDateTimeLong(value);
    }

    return (
        <span
            className={_cs(styles.dateTime, className)}
        >
            <ActualDateTime
                value={value}
                format={format}
            />
            {tooltipContent && (
                <Tooltip
                    className={styles.tooltip}
                    preferredWidth={8}
                    description={tooltipContent}
                />
            )}
        </span>
    );
}

export default DateTime;
