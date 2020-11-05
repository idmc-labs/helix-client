import React, { useCallback } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

export interface ActionProps {
    id: string;
    className?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    editLink?: string;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onDelete,
        onEdit,
        disabled,
        children,
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
                onEdit(id);
            }
        },
        [onEdit, id],
    );

    return (
        <Actions className={className}>
            {children}
            <QuickActionButton
                name={undefined}
                onClick={handleEditButtonClick}
                title="Edit"
                disabled={disabled || !onEdit}
            >
                <IoMdCreate />
            </QuickActionButton>
            <QuickActionConfirmButton
                name={undefined}
                onConfirm={handleDeleteButtonClick}
                title="Delete"
                variant="danger"
                disabled={disabled || !onDelete}
            >
                <IoMdTrash />
            </QuickActionConfirmButton>
        </Actions>
    );
}

export default ActionCell;
