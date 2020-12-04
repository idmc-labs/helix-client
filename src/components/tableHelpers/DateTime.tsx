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

    const date = new Date(value);
    const dateString = date.toLocaleDateString();
    const timeString = date.toLocaleTimeString();
    return (
        <time
            dateTime={value}
            className={className}
        >
            {`${dateString} ${timeString}`}
        </time>
    );
}

export default DateTimeCell;
