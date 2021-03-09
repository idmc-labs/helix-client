import React, { useCallback, useContext } from 'react';
import { useMutation, gql } from '@apollo/client';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    DeleteReviewCommentMutation,
    DeleteReviewCommentMutationVariables,
} from '#generated/types';
import { ReviewFields } from '#views/Entry/EntryForm/types';
import CommentViewItem from '#components/CommentItem';

const DELETE_REVIEW_COMMENT = gql`
    mutation DeleteReviewComment($id: ID!) {
        deleteReviewComment(id: $id) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

type Comment = NonNullable<ReviewFields['comment']>;

interface CommentItemProps {
    onCommentEditClick: (id: string) => void;
    onDeleteComment: () => void;
    comment: Comment;
}

function CommentItem(props: CommentItemProps) {
    const {
        onCommentEditClick,
        onDeleteComment,
        comment,
    } = props;

    const { notify } = useContext(NotificationContext);

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

    const onDeleteReviewComment = useCallback((id: string) => {
        deleteReviewComment({
            variables: { id },
        });
    }, [deleteReviewComment]);

    return (
        <CommentViewItem
            onEditComment={onCommentEditClick}
            onDeleteComment={onDeleteReviewComment}
            deletePending={deleteReviewCommentLoading}
            editPending={false}
            deleteDisabled={!commentPermission || !isUserComment}
            editDisabled={!commentPermission || !isUserComment}
            comment={comment}
        />
    );
}

export default CommentItem;
