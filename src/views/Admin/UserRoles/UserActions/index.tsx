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
    roleStatus?: string | null | undefined;
    activeStatus?: boolean;
    user?: UserRolesField | undefined;
    onToggleUserActiveStatus?: (id: string, activeStatus: boolean) => void;
    onToggleRoleStatus?: (id: string, roleStatus: boolean) => void;
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
        roleStatus,
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
                onToggleRoleStatus(id, roleStatus === 'ADMIN');
            }
        },
        [onToggleRoleStatus, id, roleStatus],
    );

    return (
        <Actions className={className}>
            {children}
            {onToggleRoleStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleRoleStatus}
                    title={roleStatus === 'ADMIN' ? 'Grant admin access' : 'Revoke admin access'}
                    disabled={disabled || !onToggleRoleStatus}
                    confirmationMessage="Are you sure you want to change the user admin access?"
                >
                    {roleStatus === 'ADMIN' ? <IoPersonAdd /> : <IoPersonRemove />}
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
