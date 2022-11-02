import React, { useCallback } from 'react';
import {
    IoTrashOutline,
    IoCreateOutline,
    IoCopyOutline,
    IoPersonRemoveOutline,
    IoPersonAddOutline,
    IoPeopleOutline,
} from 'react-icons/io5';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import QuickActionLink from '#components/QuickActionLink';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

import { RouteData, Attrs } from '#hooks/useRouteMatching';

export interface ActionProps {
    id: string;
    className?: string;

    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    onClone?: (id: string) => void;

    onChangeAssignee?: (id: string) => void;
    onClearAssignee?: (id: string) => void;
    onAssignYourself?: (id: string) => void;
    onClearAssignmentYourself?: (id: string) => void;

    disabled?: boolean;
    children?: React.ReactNode;
    editLinkRoute?: RouteData;
    editLinkAttrs?: Attrs;
}

function EventActionCell(props: ActionProps) {
    const {
        className,
        id,
        onDelete,
        onEdit,
        onClone,
        onChangeAssignee,
        onClearAssignee,
        onAssignYourself,
        onClearAssignmentYourself,
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
                onEdit(id);
            }
        },
        [onEdit, id],
    );
    const handleCloneButtonClick = useCallback(
        () => {
            if (onClone) {
                onClone(id);
            }
        },
        [onClone, id],
    );

    const handleChangeAssigneeButtonClick = useCallback(
        () => {
            if (onChangeAssignee) {
                onChangeAssignee(id);
            }
        },
        [onChangeAssignee, id],
    );
    const handleClearAssigneeButtonClick = useCallback(
        () => {
            if (onClearAssignee) {
                onClearAssignee(id);
            }
        },
        [onClearAssignee, id],
    );
    const handleAssignYourselfButtonClick = useCallback(
        () => {
            if (onAssignYourself) {
                onAssignYourself(id);
            }
        },
        [onAssignYourself, id],
    );
    const handleClearAssignmentYourselfButtonClick = useCallback(
        () => {
            if (onClearAssignmentYourself) {
                onClearAssignmentYourself(id);
            }
        },
        [onClearAssignmentYourself, id],
    );

    return (
        <Actions className={className}>
            {children}
            {onChangeAssignee && (
                <QuickActionButton
                    name={undefined}
                    onClick={handleChangeAssigneeButtonClick}
                    title="Change Assignee"
                    disabled={disabled || !onChangeAssignee}
                    transparent
                >
                    <IoPeopleOutline />
                </QuickActionButton>
            )}
            {onAssignYourself && (
                <QuickActionConfirmButton
                    name={undefined}
                    confirmationMessage="Are you sure you want to assign yourself to this event?"
                    onConfirm={handleAssignYourselfButtonClick}
                    title="Assign Yourself"
                    disabled={disabled || !onAssignYourself}
                    transparent
                >
                    <IoPersonAddOutline />
                </QuickActionConfirmButton>
            )}
            {onClearAssignmentYourself && (
                <QuickActionConfirmButton
                    name={undefined}
                    confirmationMessage="Are you sure you want to clear yourself as assignee from this event?"
                    onConfirm={handleClearAssignmentYourselfButtonClick}
                    title="Clear Yourself as Assignee"
                    disabled={disabled || !onClearAssignmentYourself}
                    transparent
                >
                    <IoPersonRemoveOutline />
                </QuickActionConfirmButton>
            )}
            {onClearAssignee && (
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={handleClearAssigneeButtonClick}
                    confirmationMessage="Are you sure you want to clear assignee from this event?"
                    title="Clear Assignee"
                    disabled={disabled || !onClearAssignee}
                    transparent
                >
                    <IoPersonRemoveOutline />
                </QuickActionConfirmButton>
            )}
            {onClone && (
                <QuickActionButton
                    name={undefined}
                    onClick={handleCloneButtonClick}
                    title="Clone"
                    disabled={disabled || !onClone}
                    transparent
                >
                    <IoCopyOutline />
                </QuickActionButton>
            )}
            {editLinkRoute && (
                <QuickActionLink
                    route={editLinkRoute}
                    attrs={editLinkAttrs}
                    title="Edit"
                    transparent
                >
                    <IoCreateOutline />
                </QuickActionLink>
            )}
            {onEdit && (
                <QuickActionButton
                    name={undefined}
                    onClick={handleEditButtonClick}
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
                    confirmationMessage="Are you sure you want to delete this event? All the associated data will also be deleted."
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

export default EventActionCell;
