import React, { useCallback } from 'react';
import {
    IoIosArchive,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

export interface IgnoreActionProps {
    id: string;
    className?: string;
    onIgnore?: ({ id }) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

function IgnoreActionCell(props: IgnoreActionProps) {
    const {
        className,
        id,
        onIgnore,
        disabled,
        children,
    } = props;

    const handleIgnoreEventClick = useCallback(
        () => {
            if (onIgnore) {
                onIgnore({ id });
            }
        },
        [onIgnore, id],
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
        </Actions>
    );
}

export default IgnoreActionCell;
