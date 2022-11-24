import React, { useCallback, useContext } from 'react';
import { useMutation, gql } from '@apollo/client';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    DeleteReviewCommentMutation,
    DeleteReviewCommentMutationVariables,

    ReviewCommentsQuery,
} from '#generated/types';
import CommentViewItem from '#components/CommentItem';

const DELETE_REVIEW_COMMENT = gql`
    mutation DeleteReviewComment($id: ID!) {
        deleteReviewComment(id: $id) {
            result {
                id
                isDeleted
                comment
            }
            errors
        }
    }
`;

interface CommentItemProps {
    onEditComment: (id: string) => void;
    onDeleteComment: () => void;
    comment: NonNullable<NonNullable<ReviewCommentsQuery['reviewComments']>['results']>[number];
    boxContainerClassName: string;
}

function CommentItem(props: CommentItemProps) {
    const {
        onEditComment,
        onDeleteComment,
        comment,
        boxContainerClassName,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const { user } = useContext(DomainContext);

    const commentPermission = user?.permissions?.reviewcomment;
    const isUserComment = comment.createdBy?.id === user?.id;

    const [
        deleteReviewComment,
        { loading: deleteReviewCommentLoading },
    ] = useMutation<DeleteReviewCommentMutation, DeleteReviewCommentMutationVariables>(
        DELETE_REVIEW_COMMENT,
        {
            update: onDeleteComment,
            onCompleted: (response) => {
                const { deleteReviewComment: deleteReviewCommentRes } = response;
                if (!deleteReviewCommentRes) {
                    return;
                }
                const { errors, result } = deleteReviewCommentRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'The comment was deleted successfully',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
            },
        },
    );

    const onDeleteReviewComment = useCallback((id: string) => {
        deleteReviewComment({
            variables: { id },
        });
    }, [deleteReviewComment]);

    return (
        <CommentViewItem
            onEditComment={onEditComment}
            onDeleteComment={onDeleteReviewComment}
            deletePending={deleteReviewCommentLoading}
            editPending={false}
            deleteDisabled={!commentPermission || !isUserComment}
            editDisabled={!commentPermission || !isUserComment}
            id={comment.id}
            createdBy={comment.createdBy}
            createdAt={comment.createdAt}
            text={comment.comment}
            boxContainerClassName={boxContainerClassName}
            isEdited={comment.isEdited}
            isDeleted={comment.isDeleted}
        />
    );
}

export default CommentItem;
