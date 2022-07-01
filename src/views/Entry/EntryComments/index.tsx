import React, { useMemo, useState, useCallback, useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager, Modal } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    EntryCommentsQuery,
    EntryCommentsQueryVariables,
} from '#generated/types';

import DomainContext from '#components/DomainContext';
import Message from '#components/Message';
import useBasicToggle from '#hooks/toggleBasicState';

import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import ReviewCommentForm from './ReviewCommentForm';

import { ReviewInputFields } from '../EntryForm/types';

import styles from './styles.css';

export const ENTRY_COMMENTS = gql`
    query EntryComments($id: ID!, $page: Int, $pageSize: Int, $ordering: String) {
        entry(id: $id) {
            id
            reviewComments(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    body
                    id
                    createdBy {
                        id
                        fullName
                    }
                    createdAt
                }
            }
        }
    }
`;

interface EntryCommentsProps {
    className?: string;
    entryId: string;
    review: ReviewInputFields;
    reviewPristine?: boolean;
    onReviewChange: React.Dispatch<React.SetStateAction<ReviewInputFields>>;
    onReviewPristineChange: (value: boolean) => void;
}

export default function EntryComments(props: EntryCommentsProps) {
    const {
        className,
        entryId,
        review,
        reviewPristine,
        onReviewChange,
        onReviewPristineChange,
    } = props;

    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [commentIdOnEdit, setCommentIdOnEdit] = useState<string | undefined>();

    const { user } = useContext(DomainContext);
    const commentPermission = user?.permissions?.reviewcomment;

    const variables = useMemo(
        () => ({
            pageSize,
            ordering: '-createdAt',
            page,
            id: entryId,
        }),
        [entryId, page, pageSize],
    );
    const {
        data: commentsData,
        refetch: refetchComments,
        loading: commentsDataLoading,
    } = useQuery<EntryCommentsQuery, EntryCommentsQueryVariables>(ENTRY_COMMENTS, {
        variables,
    });
    const data = commentsData?.entry?.reviewComments?.results;
    const addReviewPermission = user?.permissions?.review?.add;
    const totalCommentCount = commentsData?.entry?.reviewComments?.totalCount ?? 0;

    const [
        shouldShowCommentModal,
        showCommentModal,
        hideCommentModal,
    ] = useBasicToggle();

    const handleRefetch = useCallback(
        () => {
            refetchComments(variables);
        },
        [refetchComments, variables],
    );

    const handleReviewCommentSuccess = useCallback(
        (newValue: ReviewInputFields) => {
            onReviewPristineChange(true);
            onReviewChange(newValue);
            handleRefetch();
        },
        [handleRefetch, onReviewChange, onReviewPristineChange],
    );

    const handleHideCommentModal = useCallback(() => {
        setCommentIdOnEdit(undefined);
        hideCommentModal();
    }, [setCommentIdOnEdit, hideCommentModal]);

    const handleShowCommentModal = useCallback(
        (id: string) => {
            setCommentIdOnEdit(id);
            showCommentModal();
        },
        [setCommentIdOnEdit, showCommentModal],
    );

    return (
        <div className={_cs(styles.comments, className)}>
            {reviewPristine && commentPermission?.add && (
                <CommentForm
                    entry={entryId}
                    onSuccess={handleRefetch}
                    clearable
                />
            )}
            {!reviewPristine && addReviewPermission && (
                <ReviewCommentForm
                    entry={entryId}
                    review={review}
                    onSuccess={handleReviewCommentSuccess}
                />
            )}
            {data?.map((commentData) => (
                <CommentItem
                    key={commentData.id}
                    onDeleteComment={handleRefetch}
                    onEditComment={handleShowCommentModal}
                    comment={commentData}
                />
            ))}
            {shouldShowCommentModal && (
                <Modal
                    heading="Edit Comment"
                    onClose={handleHideCommentModal}
                    size="medium"
                    freeHeight
                >
                    <CommentForm
                        id={commentIdOnEdit}
                        entry={entryId}
                        onCancel={handleHideCommentModal}
                        cancelable
                    />
                </Modal>
            )}
            {!commentsDataLoading && totalCommentCount <= 0 && (
                <Message
                    message="No comment found."
                />
            )}
            <Pager
                activePage={page}
                itemsCount={commentsData?.entry?.reviewComments?.totalCount ?? 0}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </div>
    );
}
