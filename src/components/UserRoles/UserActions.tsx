import React, { useCallback } from 'react';
import {
    IoMdCreate,
    IoMdEyeOff,
    IoMdEye,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import {
    UserListQuery,
} from '#generated/types';

type UserRolesField = NonNullable<NonNullable<UserListQuery['users']>['results']>[number];

export interface ActionProps {
    id: string;
    className?: string;
    activeStatus?: boolean;
    user?: UserRolesField | undefined;
    onToggleUserActiveStatus?: (id: string, activeStatus: boolean) => void;
    onShowUserRoleForm: (user: UserRolesField['email']) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onToggleUserActiveStatus,
        onShowUserRoleForm,
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
            if (onShowUserRoleForm) {
                onShowUserRoleForm(id);
            }
        },
        [onShowUserRoleForm, id],
    );

    return (
        <Actions className={className}>
            {children}
            <QuickActionButton
                name={undefined}
                onClick={handleChangeUserRole}
                title="Edit"
                disabled={disabled || !onShowUserRoleForm}
            >
                <IoMdCreate />
            </QuickActionButton>
            {onToggleUserActiveStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleUserActiveStatus}
                    title={activeStatus ? 'Deactivate' : 'Activate'}
                    variant="danger"
                    disabled={disabled || !onToggleUserActiveStatus}
                    confirmationMessage="Do you want to change the user active status?"
                >
                    {activeStatus ? <IoMdEyeOff /> : <IoMdEye />}
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}
export default ActionCell;
