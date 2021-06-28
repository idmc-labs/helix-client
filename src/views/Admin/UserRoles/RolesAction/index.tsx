import React, { useCallback } from 'react';
import { HiShieldCheck, HiUserAdd } from 'react-icons/hi';

import Actions from '#components/Actions';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import {
    UserListQuery,
} from '#generated/types';

type UserRolesField = NonNullable<NonNullable<UserListQuery['users']>['results']>[number];

export interface RoleActionProps {
    id: string;
    className?: string;
    roleStatus?: string | null | undefined;
    user?: UserRolesField | undefined;
    userName?: string | null | undefined;
    onToggleRoleStatus?: (id: string, roleStatus: boolean) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

function RoleActionCell(props: RoleActionProps) {
    const {
        className,
        id,
        onToggleRoleStatus,
        disabled,
        children,
        roleStatus,
        userName,
    } = props;

    const handleToggleRoleStatus = useCallback(
        () => {
            if (onToggleRoleStatus) {
                if (roleStatus && roleStatus === 'ADMIN') {
                    onToggleRoleStatus(id, false);
                } else {
                    onToggleRoleStatus(id, true);
                }
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
                    title={roleStatus === 'ADMIN' ? 'Unset Admin' : 'Set Admin'}
                    variant={roleStatus === 'ADMIN' ? 'accent' : 'default'}
                    disabled={disabled || !onToggleRoleStatus}
                    confirmationMessage={`Are you sure you want to change ${userName}'s role ?`}
                >
                    {roleStatus === 'ADMIN' ? <HiShieldCheck /> : <HiUserAdd />}
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}
export default RoleActionCell;
