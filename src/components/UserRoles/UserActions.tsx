import React, { useCallback } from 'react';
import {
    IoMdCreate,
    IoMdEyeOff,
    IoMdEye,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

export interface ActionProps {
    id: string;
    className?: string;
    activeStatus?: boolean;
    onToggleUserActiveStatus?: (id: string, activeStatus: boolean) => void;
    onChangeUserRole?: (id: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onToggleUserActiveStatus,
        onChangeUserRole,
        disabled,
        children,
        activeStatus,
    } = props;

    const handleToggleUserActiveStatus = useCallback(
        () => {
            if (onToggleUserActiveStatus) {
                onToggleUserActiveStatus(id, !activeStatus);
            }
        },
        [onToggleUserActiveStatus, id, activeStatus],
    );
    const handleChangeUserRole = useCallback(
        () => {
            if (onChangeUserRole) {
                onChangeUserRole(id);
            }
        },
        [onChangeUserRole, id],
    );

    return (
        <Actions className={className}>
            {children}
            <QuickActionButton
                name={undefined}
                onClick={handleChangeUserRole}
                title="Edit"
                disabled={disabled || !onChangeUserRole}
            >
                <IoMdCreate />
            </QuickActionButton>
            {onToggleUserActiveStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleUserActiveStatus}
                    title={activeStatus ? 'Activate' : 'Deactivate'}
                    variant="danger"
                    disabled={disabled || !onToggleUserActiveStatus}
                    confirmationMessage="Change the user active status?"
                >
                    {activeStatus ? <IoMdEyeOff /> : <IoMdEye />}
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}
export default ActionCell;
