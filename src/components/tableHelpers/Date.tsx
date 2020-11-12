import React from 'react';
import { isNotDefined } from '@togglecorp/fujs';

export interface DateProps {
    value: string | undefined | null;
    className?: string;
}

function DateCell(props: DateProps) {
    const { value, className } = props;

    if (isNotDefined(value)) {
        return null;
    }

    const date = Date.parse(value);
    const dateString = new Intl.DateTimeFormat('default').format(date);
    return (
        <time
            dateTime={value}
            className={className}
        >
            {dateString}
        </time>
    );
}

export default DateCell;
