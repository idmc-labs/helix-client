import React, { useCallback } from 'react';
import {
    IoLockClosedOutline,
    IoLockOpenOutline,
    IoRocketOutline,
    IoCreateOutline,
    IoBarChartOutline,
    IoBusinessOutline,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import QuickActionButton from '#components/QuickActionButton';

import {
    UserListQuery,
} from '#generated/types';

type UserRolesField = NonNullable<NonNullable<UserListQuery['users']>['results']>[number];

export interface ActionProps {
    id: string;
    className?: string;
    disabled?: boolean;
    children?: React.ReactNode;
    onEdit?: (id: string) => void;
    user?: UserRolesField | undefined;
    activeStatus?: boolean;
    onToggleUserActiveStatus?: (id: string, activeStatus: boolean) => void;
    isAdmin?: boolean | null | undefined;
    onToggleAdminStatus?: (id: string, isAdmin: boolean) => void;
    isDirectorsOffice?: boolean | null | undefined;
    onToggleDirectorsOfficeStatus?: (id: string, isDirectorsOffice: boolean) => void;
    isReportingTeam?: boolean | null | undefined;
    onToggleReportingTeamStatus?: (id: string, isDirectorsOffice: boolean) => void;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onToggleAdminStatus,
        onToggleUserActiveStatus,
        disabled,
        children,
        activeStatus,
        onEdit,
        isAdmin,
        isDirectorsOffice,
        onToggleDirectorsOfficeStatus,
        isReportingTeam,
        onToggleReportingTeamStatus,
    } = props;

    const handleToggleUserActiveStatus = React.useCallback(
        () => {
            if (onToggleUserActiveStatus) {
                onToggleUserActiveStatus(id, !activeStatus);
            }
        },
        [onToggleUserActiveStatus, id, activeStatus],
    );

    const handleToggleAdminStatus = useCallback(
        () => {
            if (onToggleAdminStatus) {
                onToggleAdminStatus(id, !!isAdmin);
            }
        },
        [onToggleAdminStatus, id, isAdmin],
    );

    const handleToggleDirectorsOfficeStatus = useCallback(
        () => {
            if (onToggleDirectorsOfficeStatus) {
                onToggleDirectorsOfficeStatus(id, !!isDirectorsOffice);
            }
        },
        [onToggleDirectorsOfficeStatus, id, isDirectorsOffice],
    );

    const handleToggleReportingTeamStatus = useCallback(
        () => {
            if (onToggleReportingTeamStatus) {
                onToggleReportingTeamStatus(id, !!isReportingTeam);
            }
        },
        [onToggleReportingTeamStatus, id, isReportingTeam],
    );

    return (
        <Actions className={className}>
            {children}
            <QuickActionButton
                name={id}
                onClick={onEdit}
                title="Edit"
                disabled={disabled || !onEdit}
                transparent
            >
                <IoCreateOutline />
            </QuickActionButton>
            {onToggleAdminStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleAdminStatus}
                    title={!isAdmin ? 'Grant admin access' : 'Revoke admin access'}
                    variant={isAdmin ? 'danger' : 'default'}
                    disabled={disabled || !onToggleAdminStatus}
                    confirmationMessage="Are you sure you want to change the user admin access?"
                    transparent
                >
                    <IoRocketOutline />
                </QuickActionConfirmButton>
            )}
            {onToggleDirectorsOfficeStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleDirectorsOfficeStatus}
                    title={!isDirectorsOffice ? 'Grant director\'s office access' : 'Revoke director\'s office access'}
                    variant={isDirectorsOffice ? 'danger' : 'default'}
                    disabled={disabled || !onToggleDirectorsOfficeStatus}
                    confirmationMessage="Are you sure you want to change the user director's office access?"
                    transparent
                >
                    <IoBusinessOutline />
                </QuickActionConfirmButton>
            )}
            {onToggleReportingTeamStatus && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleToggleReportingTeamStatus}
                    title={!isReportingTeam ? 'Grant reporting team access' : 'Revoke reporting team access'}
                    variant={isReportingTeam ? 'danger' : 'default'}
                    disabled={disabled || !onToggleReportingTeamStatus}
                    confirmationMessage="Are you sure you want to change the user reporting team access?"
                    transparent
                >
                    <IoBarChartOutline />
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
                    transparent
                >
                    {activeStatus ? <IoLockClosedOutline /> : <IoLockOpenOutline />}
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}
export default ActionCell;
