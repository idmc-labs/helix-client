import React, { useCallback, useContext } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
} from 'react-icons/io';
import { Avatar } from '@togglecorp/toggle-ui';
import { useMutation } from '@apollo/client';

import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import DateCell from '#components/tableHelpers/Date';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    DeleteReviewCommentMutation,
    DeleteReviewCommentMutationVariables,
    EntryCommentsQuery,
} from '#generated/types';

import { DELETE_REVIEW_COMMENT } from '../queries';
import styles from './styles.css';

type Comment = NonNullable<NonNullable<NonNullable<EntryCommentsQuery['entry']>['reviewComments']>['results']>[number];

interface CommentItemProps {
    onCommentEditClick: (id: string) => void;
    onRefetchEntries: () => void;
    comment: Comment;
}

function CommentItem(props: CommentItemProps) {
    const {
        onCommentEditClick,
        onRefetchEntries,
        comment,
    } = props;
    const { id, createdAt, createdBy, body } = comment;

    const { notify } = useContext(NotificationContext);

    const { user } = useContext(DomainContext);

    const reviewPermission = user?.permissions?.review;

    const onSetEditableCommentItemId = useCallback(() => {
        onCommentEditClick(id);
    }, [id, onCommentEditClick]);

    const [
        deleteReviewComment,
        { loading: deleteReviewCommentLoading },
    ] = useMutation<DeleteReviewCommentMutation, DeleteReviewCommentMutationVariables>(
        DELETE_REVIEW_COMMENT,
        {
            update: onRefetchEntries,
            onCompleted: (response) => {
                const { deleteReviewComment: deleteReviewCommentRes } = response;
                if (!deleteReviewCommentRes) {
                    return;
                }
                const { errors, result } = deleteReviewCommentRes;
                if (errors) {
                    notify({ children: 'Sorry, the comment could not be deleted!' });
                }
                if (result) {
                    notify({ children: 'The comment was deleted successfully' });
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
            },
        },
    );

    const onDeleteReviewComment = useCallback(() => {
        if (!id) {
            return;
        }
        deleteReviewComment({
            variables: { id },
        });
    }, [deleteReviewComment, id]);

    return (
        <div className={styles.comment}>
            <div
                className={styles.avatar}
            >
                <Avatar
                    alt={createdBy?.fullName ?? 'Anon'}
                />
            </div>
            <div className={styles.box}>
                <div className={styles.name}>
                    {createdBy?.fullName ?? 'Anon'}
                </div>
                <div>
                    { body }
                </div>
                <DateCell
                    className={styles.date}
                    value={createdAt}
                    format="datetime"
                />
            </div>
            {createdBy?.id === user?.id && (
                <div className={styles.actionButtons}>
                    {reviewPermission?.change && (
                        <QuickActionButton
                            name={undefined}
                            onClick={onSetEditableCommentItemId}
                            title="Edit"
                            disabled={false}
                        >
                            <IoMdCreate />
                        </QuickActionButton>
                    )}
                    {reviewPermission?.delete && (
                        <QuickActionConfirmButton
                            name={undefined}
                            onConfirm={onDeleteReviewComment}
                            title="Delete"
                            disabled={deleteReviewCommentLoading}
                            className={styles.deleteButton}
                        >
                            <IoMdTrash />
                        </QuickActionConfirmButton>
                    )}
                </div>
            )}
        </div>
    );
}

export default CommentItem;
