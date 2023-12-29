import React, { useMemo, useCallback, useContext } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    ReviewCommentsQuery,
    ReviewCommentsQueryVariables,
    Review_Field_Type as ReviewFieldType,
} from '#generated/types';

import useFilterState from '#hooks/useFilterState';
import DomainContext from '#components/DomainContext';
import Message from '#components/Message';

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
                commentType
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
    assigneeMode?: boolean;

    onReviewEdit: (id: string) => void;
    reviewDisabled: boolean | undefined;
}

export default function ReviewComments(props: ReportCommentsProps) {
    const {
        className,
        eventId,
        figureId,
        geoLocationId,
        name,
        onReviewEdit,
        assigneeMode,
        reviewDisabled,
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

    const { user } = useContext(DomainContext);

    // FIXME: this is a different permission
    const commentPermission = user?.permissions?.reviewcomment;

    const variables = useMemo(
        () => ({
            pageSize,
            ordering: '-created_at',
            page,

            events: eventId ? [eventId] : undefined,
            figures: figureId ? [figureId] : undefined,
            fields: [name],
        }),
        [
            eventId,
            figureId,
            name,
            page,
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

    const handleRefetch = useCallback(
        () => {
            refetchComments(variables);
        },
        [refetchComments, variables],
    );

    return (
        <div className={_cs(styles.comments, className)}>
            {!reviewDisabled && commentPermission?.add && (
                <CommentForm
                    name={name}
                    eventId={eventId}
                    figureId={figureId}
                    geoLocationId={geoLocationId}
                    onCommentCreate={handleRefetch}
                    assigneeMode={assigneeMode}
                    clearable
                />
            )}
            <div className={styles.commentSection}>
                {data?.map((commentData) => (
                    <CommentItem
                        key={commentData.id}
                        onDeleteComment={handleRefetch}
                        onEditComment={onReviewEdit}
                        comment={commentData}
                    />
                ))}
            </div>
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
