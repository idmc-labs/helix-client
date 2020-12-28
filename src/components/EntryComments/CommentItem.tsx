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
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';

import {
    DeleteReviewCommentMutation,
    DeleteReviewCommentMutationVariables,
    ReviewCommentType,
    UserType,
} from '#generated/types';

import { DELETE_REVIEW_COMMENT } from './queries';
import styles from './styles.css';

interface CommentItemProps {
    onSetCommentIdOnEdit: (id: string) => void;
    onRefetchEntries: () => void;
    id: ReviewCommentType['id'];
    createdAt: ReviewCommentType['createdAt'];
    createdBy: Pick<UserType, 'id' | 'fullName' | 'username'> | undefined | null;
    body: ReviewCommentType['body'];
}

function CommentItem(props: CommentItemProps) {
    const {
        onSetCommentIdOnEdit,
        onRefetchEntries,
        id,
        createdAt,
        createdBy,
        body,
    } = props;

    const { user } = useContext(DomainContext);

    const reviewPermission = user?.permissions?.review;

    const onSetEditableCommentItemId = useCallback(() => {
        onSetCommentIdOnEdit(id);
    }, [id, onSetCommentIdOnEdit]);

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
                const { errors } = deleteReviewCommentRes;
                console.error(errors);
                // TODO: handle what to do if not okay?
            },
            onError: (error) => {
                console.error(error);
            },
            // TODO: handle onError
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
            {deleteReviewCommentLoading && <Loading /> }
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
