import React, { useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import {
    isDefined,
} from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    createDateColumn,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createStatusColumn,
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';

import {
    LatestFigureListQuery,
    LatestFigureListQueryVariables,
    DeleteLatestFigureMutation,
    DeleteLatestFigureMutationVariables,
    EntriesQueryVariables,
} from '#generated/types';
import route from '#config/routes';

const FIGURE_LIST = gql`
    query LatestFigureList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $event: String,
        $filterEntryArticleTitle: String,
        $filterEntryPublishers:[ID!],
        $filterEntrySources: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntryCreatedBy: [ID!],
        $filterFigureCountries: [ID!],
        $filterFigureStartAfter: Date
    ) {
        figureList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            event: $event,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryPublishers: $filterEntryPublishers,
            filterEntrySources: $filterEntrySources,
            filterEntryReviewStatus: $filterEntryReviewStatus,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterFigureCountries: $filterFigureCountries,
            filterFigureStartAfter: $filterFigureStartAfter
        ) {
            page
            pageSize
            totalCount
            results {
                id
                createdAt
                createdBy {
                    id
                    fullName
                }
                category {
                    id
                    name
                }
                country {
                    id
                    name
                }
                entry {
                    id
                    articleTitle
                    event {
                        id
                        name
                        eventType
                        crisis {
                            id
                            name
                        }
                    }
                    isReviewed
                    isSignedOff
                    isUnderReview
                }
                role
                totalFigures
                term {
                    id
                    name
                }
                endDate
                startDate
            }
        }
    }
`;

const FIGURE_DELETE = gql`
    mutation DeleteLatestFigure($id: ID!) {
        deleteFigure(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type FigureFields = NonNullable<NonNullable<LatestFigureListQuery['figureList']>['results']>[number];

const keySelector = (item: FigureFields) => item.id;

interface FigurePanelProps {
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;
    filters: EntriesQueryVariables;
}

function NudeFigureTable(props: FigurePanelProps) {
    const {
        className,
        eventColumnHidden,
        crisisColumnHidden,
        filters,
    } = props;

    const {
        previousData,
        data: figuresData = previousData,
        loading: loadingFigures,
        refetch: refetchFigures,
    } = useQuery<LatestFigureListQuery, LatestFigureListQueryVariables>(FIGURE_LIST, {
        variables: filters,
    });

    const [
        deleteFigure,
        { loading: loadingFigureDelete },
    ] = useMutation<DeleteLatestFigureMutation, DeleteLatestFigureMutationVariables>(
        FIGURE_DELETE,
        {
            onCompleted: (response) => {
                const { deleteFigure: deleteEntryRes } = response;
                if (!deleteEntryRes) {
                    return;
                }
                const { errors } = deleteEntryRes;
                if (!errors) {
                    refetchFigures(filters);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleEntryDelete = useCallback(
        (id: string) => {
            deleteFigure({
                variables: { id },
            });
        },
        [deleteFigure],
    );

    const { user } = useContext(DomainContext);

    const entryPermissions = user?.permissions?.entry;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<FigureFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: entryPermissions?.delete ? handleEntryDelete : undefined,
                    editLinkRoute: route.entryEdit,
                    editLinkAttrs: { entryId: datum.id },
                }),
            };

            // FIXME: update this
            return [
                createDateColumn<FigureFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                crisisColumnHidden
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
                        'event__crisis__name',
                        'Crisis',
                        (item) => ({
                            title: item.entry.event?.crisis?.name,
                            attrs: { crisisId: item.entry.event?.crisis?.id },
                        }),
                        route.crisis,
                        { sortable: true },
                    ),
                eventColumnHidden
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
                        'event__name',
                        'Event',
                        (item) => ({
                            title: item.entry.event?.name,
                            // FIXME: this may be wrong
                            attrs: { eventId: item.entry.event?.id },
                        }),
                        route.event,
                        { sortable: true },
                    ),
                createLinkColumn<FigureFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.entry.articleTitle,
                        attrs: { entryId: item.id },
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.entry.event.eventType,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'country__name',
                    'Country',
                    (item) => item.country?.name,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'term__name',
                    'Term',
                    (item) => item.term?.name,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'role',
                    'Role',
                    (item) => item.role,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'category__name',
                    'Figure Type',
                    (item) => item.category?.name,
                    { sortable: true },
                ),
                createNumberColumn<FigureFields, string>(
                    'total_figures',
                    'Total Figure',
                    (item) => item.totalFigures,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'start_date',
                    'Start Date',
                    (item) => item.startDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'end_date',
                    'End Date',
                    (item) => item.endDate,
                    { sortable: true },
                ),
                createStatusColumn<FigureFields, string>(
                    'status',
                    '',
                    (item) => ({
                        isReviewed: item.entry.isReviewed,
                        isSignedOff: item.entry.isSignedOff,
                        isUnderReview: item.entry.isUnderReview,
                    }),
                ),
                actionColumn,
            ].filter(isDefined);
        },
        [
            handleEntryDelete,
            crisisColumnHidden, eventColumnHidden,
            entryPermissions?.delete,
        ],
    );

    const totalFiguresCount = figuresData?.figureList?.totalCount ?? 0;

    return (
        <>
            {totalFiguresCount > 0 && (
                <Table
                    className={className}
                    data={figuresData?.figureList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
            )}
            {(loadingFigures || loadingFigureDelete) && <Loading absolute />}
            {!loadingFigures && totalFiguresCount <= 0 && (
                <Message
                    message="No figures found."
                />
            )}
        </>
    );
}
export default NudeFigureTable;
