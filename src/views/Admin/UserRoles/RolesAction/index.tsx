import React from 'react';
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
    onToggleRoleStatus?: (id: string, roleStatus: boolean) => void;
    disabled?: boolean;
}

function RoleActionCell(props: RoleActionProps) {
    const {
        className,
        id,
        onToggleRoleStatus,
        disabled,
        roleStatus,
    } = props;

    const handleToggleRoleStatus = React.useCallback(
        () => {
            if (onToggleRoleStatus) {
                onToggleRoleStatus(id, roleStatus === 'ADMIN');
            }
        },
        [onToggleRoleStatus, id, roleStatus],
    );

    return (
        <Actions className={className}>
            {onToggleRoleStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleRoleStatus}
                    title={roleStatus === 'ADMIN' ? 'Grant Admin Access' : 'Revoke Admin Access'}
                    variant={roleStatus === 'ADMIN' ? 'accent' : 'default'}
                    disabled={disabled || !onToggleRoleStatus}
                    confirmationMessage={"Are you sure you want to change this user's role ?"}
                >
                    {roleStatus === 'ADMIN' ? <HiShieldCheck /> : <HiUserAdd />}
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}
export default RoleActionCell;
