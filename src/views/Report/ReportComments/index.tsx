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
import useBasicToggle from '#hooks/useBasicToggle';
import useFilterState from '#hooks/useFilterState';

import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

import styles from './styles.css';

const REPORT_COMMENTS = gql`
    query ReportComments($reportId: ID!, $page: Int, $pageSize: Int, $ordering: String) {
        report(id: $reportId) {
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

    const {
        page,
        rawPage,
        setPage,

        pageSize,
        rawPageSize,
    } = useFilterState({
        filter: {},
    });

    const [commentIdOnEdit, setCommentIdOnEdit] = useState<string | undefined>();

    const { user } = useContext(DomainContext);
    const commentPermission = user?.permissions?.reportcomment;

    const variables = useMemo(
        () => ({
            pageSize,
            ordering: '-created_at',
            page,
            reportId,
        }),
        [
            reportId,
            page,
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
            <div className={styles.commentSection}>
                {data?.map((commentData) => (
                    <CommentItem
                        key={commentData.id}
                        onDeleteComment={handleRefetch}
                        onEditComment={handleShowCommentModal}
                        comment={commentData}
                    />
                ))}
            </div>
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
                activePage={rawPage}
                itemsCount={totalCommentCount}
                maxItemsPerPage={rawPageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </div>
    );
}
