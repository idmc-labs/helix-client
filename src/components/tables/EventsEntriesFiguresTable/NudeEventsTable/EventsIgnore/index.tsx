import React, { useCallback } from 'react';
import {
    IoIosArchive,
    IoIosRedo,
} from 'react-icons/io';

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
    ignoreQa: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
}

function IgnoreActionCell(props: IgnoreActionProps) {
    const {
        className,
        id,
        ignoreQa,
        onIgnore,
        onUnIgnore,
        disabled,
        children,
    } = props;

    const handleIgnoreEventClick = useCallback(
        () => {
            if (onIgnore) {
                onIgnore({ id, ignoreQa });
            }
        },
        [onIgnore, id, ignoreQa],
    );

    const handleUnIgnoreEventClick = useCallback(
        () => {
            if (onUnIgnore) {
                onUnIgnore({ id, ignoreQa });
            }
        },
        [onUnIgnore, id, ignoreQa],
    );

    return (
        <Actions className={className}>
            {children}
            {onIgnore && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleIgnoreEventClick}
                    title="Ignore"
                    variant="warning"
                    disabled={disabled || !onIgnore}
                >
                    <IoIosArchive />
                </QuickActionConfirmButton>
            )}
            {onUnIgnore && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleUnIgnoreEventClick}
                    title="Un-ignore"
                    variant="accent"
                    disabled={disabled || !onUnIgnore}
                >
                    <IoIosRedo />
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}

export default IgnoreActionCell;
