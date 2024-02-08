import React, {
    useMemo,
    useCallback,
    useContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    FigureMetadata,
} from '#components/forms/EntryForm/types';
import { EventListOption } from '#components/selections/EventListSelectInput';
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
        $page: Int,
        $pageSize: Int,
        $ordering: String,
        $filters: UnifiedReviewCommentFilterDataInputType,
    ) {
        reviewComments(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
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

    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    setFigureMetadata: (
        value: FigureMetadata
            | ((oldValue: FigureMetadata | undefined) => FigureMetadata)
            | undefined,
        key: string,
    ) => void;
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
        setEvents,
        setFigureMetadata,
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

    const commentPermission = user?.permissions?.reviewcomment;

    const variables = useMemo(
        (): ReviewCommentsQueryVariables => ({
            pageSize,
            ordering: '-created_at',
            page,

            filters: {
                events: eventId ? [eventId] : undefined,
                figures: figureId ? [figureId] : undefined,
                fields: [name],
            },
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
                    setEvents={setEvents}
                    setFigureMetadata={setFigureMetadata}
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
