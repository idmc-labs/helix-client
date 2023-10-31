import React, { useCallback } from 'react';
import {
    IoArchiveOutline,
    IoArrowRedoOutline,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

type eventValues = {
    id: string,
    ignoreQa: boolean,
}

export interface IgnoreActionProps {
    id: string;
    className?: string;
    onIgnore?: ({ id, ignoreQa }: eventValues) => void;
    onUnIgnore?: ({ id, ignoreQa }: eventValues) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

function IgnoreActionCell(props: IgnoreActionProps) {
    const {
        className,
        id,
        onIgnore,
        onUnIgnore,
        disabled,
        children,
    } = props;

    const handleIgnoreEventClick = useCallback(
        () => {
            if (onIgnore) {
                onIgnore({ id, ignoreQa: true });
            }
        },
        [onIgnore, id],
    );

    const handleUnIgnoreEventClick = useCallback(
        () => {
            if (onUnIgnore) {
                onUnIgnore({ id, ignoreQa: false });
            }
        },
        [onUnIgnore, id],
    );

    return (
        <Actions className={className}>
            {children}
            {onIgnore && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleIgnoreEventClick}
                    title="Ignore"
                    disabled={disabled || !onIgnore}
                    transparent
                >
                    <IoArchiveOutline />
                </QuickActionConfirmButton>
            )}
            {onUnIgnore && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleUnIgnoreEventClick}
                    title="Un-ignore"
                    disabled={disabled || !onUnIgnore}
                    transparent
                >
                    <IoArrowRedoOutline />
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}

export default IgnoreActionCell;
