import React, { useMemo, useState, useCallback, useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager, Modal } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    ReportCommentsQuery,
    ReportCommentsQueryVariables,
} from '#generated/types';

import DomainContext from '#components/DomainContext';
import Message from '#components/Message';
import useBasicToggle from '#hooks/toggleBasicState';
import useDebouncedValue from '#hooks/useDebouncedValue';

import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

import styles from './styles.css';

const REPORT_COMMENTS = gql`
    query ReportComments($id: ID!, $page: Int, $pageSize: Int, $ordering: String) {
        report(id: $id) {
            id
            comments(ordering: $ordering, page: $page, pageSize: $pageSize) {
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

interface ReportCommentsProps {
    className?: string;
    reportId: string;
}

export default function ReportComments(props: ReportCommentsProps) {
    const {
        className,
        reportId,
    } = props;

    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const debouncedPage = useDebouncedValue(page);

    const [commentIdOnEdit, setCommentIdOnEdit] = useState<string | undefined>();

    const { user } = useContext(DomainContext);
    const commentPermission = user?.permissions?.reportcomment;

    const variables = useMemo(
        () => ({
            pageSize,
            ordering: '-createdAt',
            page: debouncedPage,
            id: reportId,
        }),
        [
            reportId,
            debouncedPage,
            pageSize,
        ],
    );
    const {
        data: commentsData,
        refetch: refetchComments,
        loading: commentsDataLoading,
    } = useQuery<ReportCommentsQuery, ReportCommentsQueryVariables>(REPORT_COMMENTS, {
        variables,
    });
    const data = commentsData?.report?.comments?.results;
    const totalCommentCount = commentsData?.report?.comments?.totalCount ?? 0;

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
                    report={reportId}
                    onCommentCreate={handleRefetch}
                    clearable
                />
            )}
            {data?.map((commentData) => (
                <CommentItem
                    // FIXME: check if it is your own comment before edit/delete
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
                        report={reportId}
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
                itemsCount={commentsData?.report?.comments?.totalCount ?? 0}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </div>
    );
}
