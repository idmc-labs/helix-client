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
        [entryId, page],
    );
    const {
        data: commentsData,
        refetch: refetchComments,
        loading: commentsDataLoading,
        // FIXME: handle error
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
                onRefetchEntries={handleRefetch}
            />
            {data?.map((commentData) => (
                <CommentItem
                    key={commentData.id}
                    onRefetchEntries={handleRefetch}
                    onSetCommentIdOnEdit={handleShowCommentModal}
                    id={commentData.id}
                    createdAt={commentData.createdAt}
                    body={commentData.body}
                    createdBy={commentData.createdBy}
                />
            ))}
            {shouldShowCommentModal && (
                <Modal
                    heading="Edit Comment"
                    onClose={handleHideCommentModal}
                >
                    <CommentForm
                        entry={entryId}
                        onRefetchEntries={handleRefetch}
                        id={commentIdOnEdit}
                        onCommentFormModalClose={handleHideCommentModal}
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
