import React, { useMemo, useState, useCallback, useContext } from 'react';
import { useQuery } from '@apollo/client';
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
import { ENTRY_COMMENTS } from './queries';

import styles from './styles.css';

interface EntryCommentsProps {
    className?: string;
    entryId: string;
}

export default function EntryComments(props: EntryCommentsProps) {
    const {
        className,
        entryId,
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
            {commentPermission?.add && (
                <CommentForm
                    entry={entryId}
                    onCommentCreate={handleRefetch}
                    clearable
                    minimal
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
                >
                    <CommentForm
                        id={commentIdOnEdit}
                        entry={entryId}
                        onCommentFormCancel={handleHideCommentModal}
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
                // onItemsPerPageChange={setPageSize}
                onItemsPerPageChange={undefined}
                itemsPerPageControlHidden
            />
        </div>
    );
}
