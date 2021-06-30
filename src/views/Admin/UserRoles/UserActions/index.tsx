import React from 'react';
import {
    IoMdUnlock,
    IoMdLock,
} from 'react-icons/io';

import Actions from '#components/Actions';
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
    disabled?: boolean;
    children?: React.ReactNode;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onToggleUserActiveStatus,
        disabled,
        children,
        activeStatus,
    } = props;

    const handleToggleUserActiveStatus = React.useCallback(
        () => {
            if (onToggleUserActiveStatus) {
                onToggleUserActiveStatus(id, !activeStatus);
            }
        },
        [onToggleUserActiveStatus, id, activeStatus],
    );

    return (
        <Actions className={className}>
            {children}
            {onToggleUserActiveStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleUserActiveStatus}
                    title={activeStatus ? 'Deactivate' : 'Activate'}
                    variant={activeStatus ? 'danger' : 'default'}
                    disabled={disabled || !onToggleUserActiveStatus}
                    confirmationMessage="Do you want to change the user active status?"
                >
                    {activeStatus ? <IoMdUnlock /> : <IoMdLock />}
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}
export default ActionCell;
