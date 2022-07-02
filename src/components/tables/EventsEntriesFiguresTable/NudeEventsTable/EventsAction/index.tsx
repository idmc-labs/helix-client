import React, { useCallback } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionLink from '#components/QuickActionLink';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import { CrisisOption } from '#components/selections/CrisisSelectInput';

import { RouteData, Attrs } from '#hooks/useRouteMatching';

export interface ActionProps {
    id: string;
    className?: string;
    deleteTitle?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, crisis?: CrisisOption | null) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    editLinkRoute?: RouteData;
    editLinkAttrs?: Attrs;
    crisis: CrisisOption | undefined | null;
}

function EventActionCell(props: ActionProps) {
    const {
        className,
        id,
        deleteTitle = '',
        crisis,
        onDelete,
        onEdit,
        disabled,
        children,
        editLinkRoute,
        editLinkAttrs,
    } = props;

    const handleDeleteButtonClick = useCallback(
        () => {
            if (onDelete) {
                onDelete(id);
            }
        },
        [onDelete, id],
    );
    const handleEditButtonClick = useCallback(
        () => {
            if (onEdit) {
                onEdit(id, crisis);
            }
        },
        [onEdit, id, crisis],
    );

    return (
        <Actions className={className}>
            {children}
            {editLinkRoute && (
                <QuickActionLink
                    route={editLinkRoute}
                    attrs={editLinkAttrs}
                    title="Edit"
                >
                    <IoMdCreate />
                </QuickActionLink>
            )}
            {onEdit && (
                <QuickActionButton
                    name={undefined}
                    onClick={handleEditButtonClick}
                    title="Edit"
                    disabled={disabled || !onEdit}
                >
                    <IoMdCreate />
                </QuickActionButton>
            )}
            {onDelete && (
                <QuickActionConfirmButton
                    name={undefined}
                    confirmationMessage={`Are you sure you want to delete this ${deleteTitle} ?
                    All the associated data will also be deleted.`}
                    onConfirm={handleDeleteButtonClick}
                    title="Delete"
                    variant="danger"
                    disabled={disabled || !onDelete}
                >
                    <IoMdTrash />
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}

export default EventActionCell;
