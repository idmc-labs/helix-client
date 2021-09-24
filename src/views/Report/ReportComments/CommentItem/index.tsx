import React, { useCallback, useContext } from 'react';
import { useMutation, gql } from '@apollo/client';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    DeleteReportCommentMutation,
    DeleteReportCommentMutationVariables,
} from '#generated/types';
import CommentViewItem, { Comment } from '#components/CommentItem';

const DELETE_REPORT_COMMENT = gql`
    mutation DeleteReportComment($id: ID!) {
        deleteReportComment(id: $id) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

interface CommentItemProps {
    onEditComment: (id: string) => void;
    onDeleteComment: () => void;
    comment: Comment;
}

function CommentItem(props: CommentItemProps) {
    const {
        onEditComment,
        onDeleteComment,
        comment,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const { user } = useContext(DomainContext);

    const commentPermission = user?.permissions?.reportcomment;
    const isUserComment = comment.createdBy?.id === user?.id;

    const [
        deleteReportComment,
        { loading: deleteReportCommentLoading },
    ] = useMutation<DeleteReportCommentMutation, DeleteReportCommentMutationVariables>(
        DELETE_REPORT_COMMENT,
        {
            update: onDeleteComment,
            onCompleted: (response) => {
                const { deleteReportComment: deleteReportCommentRes } = response;
                if (!deleteReportCommentRes) {
                    return;
                }
                const { errors, result } = deleteReportCommentRes;
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

    const onDeleteReportComment = useCallback((id: string) => {
        deleteReportComment({
            variables: { id },
        });
    }, [deleteReportComment]);

    return (
        <CommentViewItem
            onEditComment={onEditComment}
            onDeleteComment={onDeleteReportComment}
            deletePending={deleteReportCommentLoading}
            editPending={false}
            deleteDisabled={!commentPermission || !isUserComment}
            editDisabled={!commentPermission || !isUserComment}
            comment={comment}
        />
    );
}

export default CommentItem;
