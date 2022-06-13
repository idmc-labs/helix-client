import React, { useCallback } from 'react';
import {
    IoLockClosed,
    IoLockOpen,
    IoPersonRemove,
    IoPersonAdd,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import {
    UserListQuery,
} from '#generated/types';

type UserRolesField = NonNullable<NonNullable<UserListQuery['users']>['results']>[number];

export interface ActionProps {
    id: string;
    className?: string;
    isAdmin?: boolean | null | undefined;
    activeStatus?: boolean;
    user?: UserRolesField | undefined;
    onToggleUserActiveStatus?: (id: string, activeStatus: boolean) => void;
    onToggleRoleStatus?: (id: string, isAdmin: boolean) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onToggleRoleStatus,
        onToggleUserActiveStatus,
        disabled,
        children,
        activeStatus,
        isAdmin,
    } = props;

    const handleToggleUserActiveStatus = React.useCallback(
        () => {
            if (onToggleUserActiveStatus) {
                onToggleUserActiveStatus(id, !activeStatus);
            }
        },
        [onToggleUserActiveStatus, id, activeStatus],
    );

    const handleToggleRoleStatus = useCallback(
        () => {
            if (onToggleRoleStatus) {
                onToggleRoleStatus(id, !!isAdmin);
            }
        },
        [onToggleRoleStatus, id, isAdmin],
    );

    return (
        <Actions className={className}>
            {children}
            {onToggleRoleStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleRoleStatus}
                    title={!isAdmin ? 'Grant admin access' : 'Revoke admin access'}
                    disabled={disabled || !onToggleRoleStatus}
                    confirmationMessage="Are you sure you want to change the user admin access?"
                >
                    {!isAdmin ? <IoPersonAdd /> : <IoPersonRemove />}
                </QuickActionConfirmButton>
            )}
            {onToggleUserActiveStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleUserActiveStatus}
                    title={activeStatus ? 'Deactivate' : 'Activate'}
                    variant={activeStatus ? 'danger' : 'default'}
                    disabled={disabled || !onToggleUserActiveStatus}
                    confirmationMessage="Do you want to change the user active status?"
                >
                    {activeStatus ? <IoLockClosed /> : <IoLockOpen />}
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}
export default ActionCell;
