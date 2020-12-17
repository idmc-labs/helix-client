import React from 'react';
import { isNotDefined } from '@togglecorp/fujs';

export interface DateTimeProps {
    value: string | undefined | null;
    className?: string;
}

function DateTimeCell(props: DateTimeProps) {
    const { value, className } = props;

    if (isNotDefined(value)) {
        return null;
    }

    const date = Date.parse(value);
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    };

    const dateTimeString = new Intl.DateTimeFormat('default', options).format(date);

    return (
        <time
            dateTime={value}
            className={className}
        >
            {dateTimeString}
        </time>
    );
}

export default DateTimeCell;
