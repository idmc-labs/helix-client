import React from 'react';
import {
    IoCheckmarkOutline,
    IoReturnUpBackOutline,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';

export interface ActionProps {
    className?: string;
    id: string;
    onMarkRead?: (id: string) => void;
    onMarkUnread?: (id: string) => void;
    disabled?: boolean;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onMarkRead,
        onMarkUnread,
        disabled,
    } = props;

    return (
        <Actions className={className}>
            {onMarkUnread && (
                <QuickActionButton
                    name={id}
                    onClick={onMarkUnread}
                    title="Mark as Unread"
                    disabled={disabled}
                    transparent
                >
                    <IoReturnUpBackOutline />
                </QuickActionButton>
            )}
            {onMarkRead && (
                <QuickActionButton
                    name={id}
                    onClick={onMarkRead}
                    title="Mark as Read"
                    disabled={disabled}
                    transparent
                >
                    <IoCheckmarkOutline />
                </QuickActionButton>
            )}
        </Actions>
    );
}

export default ActionCell;
