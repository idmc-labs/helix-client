import React, { useMemo, useState, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';
import { Pager, Modal } from '@togglecorp/toggle-ui';

import {
    EntryCommentsQuery,
    EntryCommentsQueryVariables,
} from '#generated/types';

import useBasicToggle from '#hooks/toggleBasicState';
import Loading from '#components/Loading';

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
    const [pageSize, setPageSize] = useState(50);
    const [commentIdOnEdit, setCommentIdOnEdit] = useState<string | undefined>();

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
    const loading = commentsDataLoading;

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
        <div
            className={_cs(styles.commentList, className)}
        >
            {loading && <Loading />}
            <CommentForm
                entry={entryId}
                clearable
                onRefetchEntries={handleRefetch}
            />
            {data?.map((commentData) => (
                <CommentItem
                    key={commentData.id}
                    onRefetchEntries={handleRefetch}
                    onCommentEditClick={handleShowCommentModal}
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
            <Pager
                activePage={page}
                itemsCount={commentsData?.entry?.reviewComments?.totalCount ?? 0}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                onItemsPerPageChange={setPageSize}
            />
        </div>
    );
}
