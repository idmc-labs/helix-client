import React, { useMemo, useState, useCallback, useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager, Modal } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    ReviewCommentsQuery,
    ReviewCommentsQueryVariables,
    Review_Field_Type as ReviewFieldType,
} from '#generated/types';

import DomainContext from '#components/DomainContext';
import Message from '#components/Message';
import useBasicToggle from '#hooks/toggleBasicState';
import useDebouncedValue from '#hooks/useDebouncedValue';

import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

import styles from './styles.css';

const REVIEW_COMMENTS = gql`
    query ReviewComments(
        $fields: [String!],
        $events: [ID!],
        $figures: [ID!],
        $page: Int,
        $pageSize: Int,
        $ordering: String,
    ) {
        reviewComments(
            events: $events,
            fields: $fields,
            figures: $figures,
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
        ) {
            totalCount
            results {
                id
                isDeleted
                isEdited
                comment
                createdAt
                createdBy {
                    id
                    fullName
                }
            }
        }
    }
`;

interface ReportCommentsProps {
    className?: string;
    eventId?: string;
    figureId?: string;
    geoLocationId?: string;
    name: ReviewFieldType;
}

export default function ReviewComments(props: ReportCommentsProps) {
    const {
        className,
        eventId,
        figureId,
        geoLocationId,
        name,
    } = props;

    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const debouncedPage = useDebouncedValue(page);

    const [commentIdOnEdit, setCommentIdOnEdit] = useState<string | undefined>();

    const { user } = useContext(DomainContext);

    // FIXME: this is a different permission
    const commentPermission = user?.permissions?.reviewcomment;

    const variables = useMemo(
        () => ({
            pageSize,
            ordering: '-createdAt',
            page: debouncedPage,

            events: eventId ? [eventId] : undefined,
            figures: figureId ? [figureId] : undefined,
            fields: [name],
        }),
        [
            eventId,
            figureId,
            name,
            debouncedPage,
            pageSize,
        ],
    );
    const {
        data: commentsData,
        refetch: refetchComments,
        loading: commentsDataLoading,
    } = useQuery<ReviewCommentsQuery, ReviewCommentsQueryVariables>(REVIEW_COMMENTS, {
        variables,
    });

    const data = commentsData?.reviewComments?.results;
    const totalCommentCount = commentsData?.reviewComments?.totalCount ?? 0;

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
                    name={name}
                    eventId={eventId}
                    figureId={figureId}
                    geoLocationId={geoLocationId}
                    onCommentCreate={handleRefetch}
                    clearable
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
                        name={name}
                        eventId={eventId}
                        figureId={figureId}
                        geoLocationId={geoLocationId}
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
                itemsCount={totalCommentCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </div>
    );
}
