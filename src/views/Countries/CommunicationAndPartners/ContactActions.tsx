import React, { useCallback } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
    IoIosChatboxes,
    IoIosPersonAdd,
} from 'react-icons/io';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

export interface ActionProps {
    id: string;
    className?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    onViewCommunication?: (id: string) => void;
    onAddCommunication?: (id: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
}

function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onDelete,
        onEdit,
        onViewCommunication,
        onAddCommunication,
        disabled,
        children,
    } = props;

    const handleContactDelete = useCallback(
        () => {
            if (onDelete) {
                onDelete(id);
            }
        },
        [onDelete, id],
    );
    const handleContactEdit = useCallback(
        () => {
            if (onEdit) {
                onEdit(id);
            }
        },
        [onEdit, id],
    );

    const handleCommunicationView = useCallback(
        () => {
            if (onViewCommunication) {
                onViewCommunication(id);
            }
        },
        [onViewCommunication, id],
    );

    const handleCommunicationAdd = useCallback(
        () => {
            if (onAddCommunication) {
                onAddCommunication(id);
            }
        },
        [onAddCommunication, id],
    );
    return (
        <Actions className={className}>
            {children}
            <QuickActionButton
                name={undefined}
                onClick={handleCommunicationView}
                title="View Communication"
                disabled={disabled || !onViewCommunication}
            >
                <IoIosChatboxes />
            </QuickActionButton>
            <QuickActionButton
                name={undefined}
                onClick={handleCommunicationAdd}
                title="Add Communication"
                disabled={disabled || !onAddCommunication}
            >
                <IoIosPersonAdd />
            </QuickActionButton>
            <QuickActionButton
                name={undefined}
                onClick={handleContactEdit}
                title="Edit"
                disabled={disabled || !onEdit}
            >
                <IoMdCreate />
            </QuickActionButton>
            <QuickActionConfirmButton
                name={undefined}
                onConfirm={handleContactDelete}
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
