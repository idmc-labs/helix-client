import React from 'react';

export interface DateProps {
    value: string | undefined;
    className?: string;
}

function DateCell(props: DateProps) {
    const { value, className } = props;
    if (!value) {
        return null;
    }
    const date = new Date(value);
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
