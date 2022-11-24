import React, { useCallback } from 'react';
import {
    IoTrashOutline,
    IoCreateOutline,
} from 'react-icons/io5';
import { Avatar, DateTime } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';

import styles from './styles.css';

interface CommentItemProps {
    onEditComment?: (id: string) => void;
    onDeleteComment?: (id: string) => void;
    deleteDisabled?: boolean;
    editDisabled?: boolean;
    deletePending?: boolean;
    editPending?: boolean;

    id: string;
    createdAt: string | null | undefined;
    createdBy: {
        id: string;
        fullName: string;
    } | null | undefined;
    text: string | null | undefined;
    boxContainerClassName: string;
    isEdited: boolean;
    isDeleted: boolean;
}

function CommentItem(props: CommentItemProps) {
    const {
        onEditComment,
        onDeleteComment,
        deleteDisabled,
        editDisabled,
        deletePending,
        editPending,

        id,
        createdAt,
        createdBy,
        text,
        boxContainerClassName,
        isEdited,
        isDeleted,
    } = props;

    const handleEdit = useCallback(() => {
        if (onEditComment) {
            onEditComment(id);
        }
    }, [id, onEditComment]);

    const handleDelete = useCallback(() => {
        if (onDeleteComment) {
            onDeleteComment(id);
        }
    }, [id, onDeleteComment]);

    return (
        <div className={styles.comment}>
            <div
                className={styles.avatar}
            >
                <Avatar
                    alt={createdBy?.fullName ?? 'Anon'}
                />
            </div>
            <div className={_cs(
                styles.box,
                boxContainerClassName,
            )}
            >
                <div className={styles.name}>
                    {createdBy?.fullName ?? 'Anon'}
                </div>
                {isDeleted && (
                    <div>(deleted)</div>
                )}
                <div>
                    {text}
                </div>
                {isEdited && (
                    <div>(edited)</div>
                )}
                <DateTime
                    className={styles.date}
                    value={createdAt}
                    format="datetime"
                />
            </div>
            <div className={styles.actionButtons}>
                {!editDisabled && (
                    <QuickActionButton
                        name={undefined}
                        onClick={handleEdit}
                        title="Edit"
                        disabled={editPending}
                        transparent
                    >
                        <IoCreateOutline />
                    </QuickActionButton>
                )}
                {!deleteDisabled && (
                    <QuickActionConfirmButton
                        name={undefined}
                        onConfirm={handleDelete}
                        title="Delete"
                        disabled={deletePending}
                        variant="danger"
                        transparent
                    >
                        <IoTrashOutline />
                    </QuickActionConfirmButton>
                )}
            </div>
        </div>
    );
}

export default CommentItem;
