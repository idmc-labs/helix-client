import React from 'react';
import Message from '#components/Message';

interface TableMessageProps {
    errored: boolean | undefined;
    filtered: boolean | undefined;
    totalItems: number | undefined;
    emptyMessage?: string,
    emptyMessageWithFilters?: string,
    errorMessage?: string,
}

function TableMessage(props: TableMessageProps) {
    const {
        errored,
        filtered,
        totalItems = 0,
        emptyMessage = 'No data found',
        emptyMessageWithFilters = 'No data found with current filters',
        errorMessage = 'Error fetching data',
    } = props;

    let message;
    if (errored) {
        message = errorMessage;
    } else if (filtered && totalItems <= 0) {
        message = emptyMessageWithFilters;
    } else if (!filtered && totalItems <= 0) {
        message = emptyMessage;
    }
    if (!message) {
        return null;
    }

    return (
        <Message
            message={message}
        />
    );
}

export default TableMessage;
