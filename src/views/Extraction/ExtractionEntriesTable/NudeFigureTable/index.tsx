import React, { useMemo, useCallback, useContext, useEffect } from 'react';
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
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createStatusColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    ExtractionFigureListQuery,
    ExtractionFigureListQueryVariables,
    DeleteFigureMutation,
    DeleteFigureMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import route from '#config/routes';

export const FIGURE_LIST = gql`
    query ExtractionFigureList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $event: String,
        $filterFigureCategories: [String!],
        $filterEntryArticleTitle: String,
        $filterEntryPublishers:[ID!],
        $filterEntrySources: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntryCreatedBy: [ID!],
        $filterFigureCountries: [ID!],
        $filterFigureStartAfter: Date,
        $filterFigureEndBefore: Date,
        $filterFigureTerms: [ID!],
        $filterEntryHasDisaggregatedData: Boolean,
        $filterFigureRoles: [String!],
        $filterFigureRegions: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterEvents: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventCrises: [ID!],
        $filterFigureTags: [ID!],
        $filterEntryHasReviewComments: Boolean,
    ) {
        figureList(
            filterFigureCategories: $filterFigureCategories,
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
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureTerms: $filterFigureTerms,
            filterEntryHasDisaggregatedData: $filterEntryHasDisaggregatedData,
            filterFigureRoles: $filterFigureRoles,
            filterFigureRegions: $filterFigureRegions,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterEvents: $filterEvents,
            filterEventCrisisTypes: $filterEventCrisisTypes,
            filterEventCrises: $filterEventCrises,
            filterFigureTags: $filterFigureTags,
            filterEntryHasReviewComments: $filterEntryHasReviewComments,
        ) {
            page
            pageSize
            totalCount
            results {
                id
                oldId
                createdAt
                createdBy {
                    id
                    fullName
                }
                category
                country {
                    id
                    idmcShortName
                }
                entry {
                    id
                    oldId
                    articleTitle
                    isReviewed
                    isSignedOff
                    isUnderReview
                }
                event {
                    id
                    oldId
                    name
                    eventType
                    crisis {
                        id
                        name
                    }
                }
                role
                totalFigures
                term
                endDate
                startDate
            }
        }
    }
`;

const FIGURE_DELETE = gql`
    mutation DeleteFigure($id: ID!) {
        deleteFigure(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type FigureFields = NonNullable<NonNullable<ExtractionFigureListQuery['figureList']>['results']>[number];

const keySelector = (item: FigureFields) => item.id;

interface NudeFigureTableProps {
    className?: string;
    filters?: ExtractionEntryListFiltersQueryVariables;
    onTotalFiguresChange?: (value: number) => void;
}

function NudeFigureTable(props: NudeFigureTableProps) {
    const {
        className,
        filters,
        onTotalFiguresChange,
    } = props;

    const {
        previousData,
        data: figuresData = previousData,
        loading: loadingFigures,
        refetch: refetchFigures,
    } = useQuery<ExtractionFigureListQuery, ExtractionFigureListQueryVariables>(FIGURE_LIST, {
        variables: filters,
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        deleteFigure,
        { loading: deletingFigure },
    ] = useMutation<DeleteFigureMutation, DeleteFigureMutationVariables>(
        FIGURE_DELETE,
        {
            onCompleted: (response) => {
                const { deleteFigure: deleteFigureRes } = response;
                if (!deleteFigureRes) {
                    return;
                }
                const { errors } = deleteFigureRes;
                if (errors) {
                    notifyGQLError(errors);
                } else {
                    refetchFigures(filters);
                    notify({
                        children: 'Figure deleted successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleFigureDelete = useCallback(
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
                    onDelete: entryPermissions?.delete ? handleFigureDelete : undefined,
                    editLinkRoute: route.entryEdit,
                    editLinkAttrs: { entryId: datum.entry.id },
                }),
            };

            return [
                createDateColumn<FigureFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                createLinkColumn<FigureFields, string>(
                    'entry__event__crisis__name',
                    'Crisis',
                    (item) => ({
                        title: item.event?.crisis?.name,
                        attrs: { crisisId: item.event?.crisis?.id },
                        ext: undefined,
                    }),
                    route.crisis,
                    { sortable: true },
                ),
                createLinkColumn<FigureFields, string>(
                    'entry__event__name',
                    'Event',
                    (item) => ({
                        title: item.event?.name,
                        // FIXME: this may be wrong
                        attrs: { eventId: item.event?.id },
                        ext: item.event?.oldId
                            ? `/events/${item.event.oldId}`
                            : undefined,
                    }),
                    route.event,
                    { sortable: true },
                ),
                createStatusColumn<FigureFields, string>(
                    'entry__article_title',
                    'Entry',
                    (item) => ({
                        title: item.entry.articleTitle,
                        attrs: { entryId: item.entry.id },
                        isReviewed: item.entry.isReviewed,
                        isSignedOff: item.entry.isSignedOff,
                        isUnderReview: item.entry.isUnderReview,
                        ext: item.entry.oldId
                            ? `/documents/${item.entry.oldId}`
                            : undefined,
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'entry__event__event_type',
                    'Cause',
                    (item) => item.event?.eventType,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'country__name',
                    'Country',
                    (item) => item.country?.idmcShortName,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'term',
                    'Term',
                    (item) => item.term as string,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'role',
                    'Role',
                    (item) => item.role,
                    { sortable: true },
                ),
                createLinkColumn<FigureFields, string>(
                    'category',
                    'Figure Category',
                    (item) => ({
                        title: item.category,
                        attrs: { eventId: item.event?.id },
                        ext: item.oldId
                            ? `/facts/${item.oldId}`
                            : undefined,
                    }),
                    route.event,
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
                actionColumn,
            ].filter(isDefined);
        },
        [
            handleFigureDelete,
            entryPermissions?.delete,
        ],
    );

    const queryBasedFigureList = figuresData?.figureList?.results;
    const totalFiguresCount = figuresData?.figureList?.totalCount ?? 0;

    // NOTE: if we don't pass total figures count this way,
    // we will have to use Portal to move the Pager component
    useEffect(
        () => {
            if (onTotalFiguresChange) {
                onTotalFiguresChange(totalFiguresCount);
            }
        },
        [onTotalFiguresChange, totalFiguresCount],
    );

    return (
        <>
            {totalFiguresCount > 0 && (
                <Table
                    className={className}
                    data={queryBasedFigureList}
                    keySelector={keySelector}
                    columns={columns}
                    resizableColumn
                    fixedColumnWidth
                />
            )}
            {(loadingFigures || deletingFigure) && <Loading absolute />}
            {!loadingFigures && totalFiguresCount <= 0 && (
                <Message
                    message="No figures found."
                />
            )}
        </>
    );
}
export default NudeFigureTable;
