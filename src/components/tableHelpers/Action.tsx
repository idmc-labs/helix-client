import React, { useCallback } from 'react';
import {
    IoTrashOutline,
    IoCreateOutline,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionLink from '#components/QuickActionLink';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

import { RouteData, Attrs } from '#hooks/useRouteMatching';

export interface ActionProps {
    id: string;
    deleteTitle?: string;
    className?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    editLinkRoute?: RouteData;
    editLinkAttrs?: Attrs;
    editHash?: string;
    editSearch?: string;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        deleteTitle = '',
        onDelete,
        onEdit,
        disabled,
        children,
        editLinkRoute,
        editLinkAttrs,
        editHash,
        editSearch,
    } = props;

    const handleDeleteButtonClick = useCallback(
        () => {
            if (onDelete) {
                onDelete(id);
            }
        },
        [onDelete, id],
    );
    return (
        <Actions
            className={className}
        >
            {children}
            {editLinkRoute && (
                <QuickActionLink
                    route={editLinkRoute}
                    attrs={editLinkAttrs}
                    title="Edit"
                    hash={editHash}
                    search={editSearch}
                    transparent
                >
                    <IoCreateOutline />
                </QuickActionLink>
            )}
            {onEdit && (
                <QuickActionButton
                    name={id}
                    onClick={onEdit}
                    title="Edit"
                    disabled={disabled || !onEdit}
                    transparent
                >
                    <IoCreateOutline />
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
                    transparent
                >
                    <IoTrashOutline />
                </QuickActionConfirmButton>
            )}
        </Actions>
    );
}

export default ActionCell;
