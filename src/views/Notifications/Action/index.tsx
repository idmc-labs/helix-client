import React, { useCallback } from 'react';
import {
    IoCheckmarkOutline,
    IoReturnUpBackOutline,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

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

    const handleMarkRead = useCallback(
        () => {
            if (onMarkRead) {
                onMarkRead(id);
            }
        },
        [onMarkRead, id],
    );
    const handleMarkUnread = useCallback(
        () => {
            if (onMarkUnread) {
                onMarkUnread(id);
            }
        },
        [onMarkUnread, id],
    );

    return (
        <Actions className={className}>
            {onMarkUnread && (
                <QuickActionButton
                    name={undefined}
                    onClick={handleMarkUnread}
                    title="Mark as Unread"
                    disabled={disabled || !onMarkUnread}
                    transparent
                >
                    <IoReturnUpBackOutline />
                </QuickActionButton>
            )}
            {onMarkRead && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleMarkRead}
                    title="Mark as Read"
                    disabled={disabled || !onMarkRead}
                    transparent
                >
                    <IoCheckmarkOutline />
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}

export default ActionCell;
