import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    createDateColumn,
    createExpandColumn,
    useTableRowExpansion,
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
import EntryFiguresTable from '#components/tables/EntryFiguresTable';
import DomainContext from '#components/DomainContext';

import {
    EntriesQuery,
    EntriesQueryVariables,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
} from '#generated/types';
import route from '#config/routes';

const ENTRY_LIST = gql`
    query Entries(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $event: ID,
        $filterEntryArticleTitle: String,
        $filterEntryPublishers:[ID!],
        $filterEntrySources: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntryCreatedBy: [ID!],
        $filterFigureCountries: [ID!],
        $filterFigureStartAfter: Date
    ) {
        entryList(
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
                articleTitle
                createdAt
                id
                isReviewed
                isSignedOff
                isUnderReview
                createdBy {
                    fullName
                }
                publishDate
                publishers {
                    results {
                        id
                        name
                    }
                }
                sources {
                    results {
                        id
                        name
                    }
                }
                url
                event {
                    id
                    name
                    eventType
                    crisis {
                        id
                        name
                    }
                }
                totalStockIdpFigures
                totalFlowNdFigures
            }
        }
    }
`;

const ENTRY_DELETE = gql`
    mutation DeleteEntry($id: ID!) {
        deleteEntry(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type EntryFields = NonNullable<NonNullable<EntriesQuery['entryList']>['results']>[number];

const keySelector = (item: EntryFields) => item.id;

interface EntryPanelProps {
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;
    filters: EntriesQueryVariables;
}

function NudeEntryTable(props: EntryPanelProps) {
    const {
        className,
        eventColumnHidden,
        crisisColumnHidden,
        filters,
    } = props;

    const [expandedRow, setExpandedRow] = useState<string | undefined>();

    const {
        previousData,
        data: entriesData = previousData,
        loading: loadingEntries,
        refetch: refetchEntries,
    } = useQuery<EntriesQuery, EntriesQueryVariables>(ENTRY_LIST, {
        variables: filters,
    });

    const [
        deleteEntry,
        { loading: deletingEntry },
    ] = useMutation<DeleteEntryMutation, DeleteEntryMutationVariables>(
        ENTRY_DELETE,
        {
            onCompleted: (response) => {
                const { deleteEntry: deleteEntryRes } = response;
                if (!deleteEntryRes) {
                    return;
                }
                const { errors } = deleteEntryRes;
                if (!errors) {
                    refetchEntries(filters);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleEntryDelete = useCallback(
        (id: string) => {
            deleteEntry({
                variables: { id },
            });
        },
        [deleteEntry],
    );

    const handleRowExpand = React.useCallback(
        (rowId: string) => {
            setExpandedRow((previousExpandedId) => (
                previousExpandedId === rowId ? undefined : rowId
            ));
        }, [],
    );

    const rowModifier = useTableRowExpansion<EntryFields, string>(
        expandedRow,
        ({ datum }) => (
            <EntryFiguresTable
                entry={datum.id}
                compact
            />
        ),
    );

    const { user } = useContext(DomainContext);

    const entryPermissions = user?.permissions?.entry;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<EntryFields, string, ActionProps, TableHeaderCellProps> = {
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

            return [
                createExpandColumn<EntryFields, string>(
                    'expand-button',
                    '',
                    handleRowExpand,
                    expandedRow,
                    // FIXME: expandedRow should be <string | undefined> in createExpandColumn
                ),
                createDateColumn<EntryFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                crisisColumnHidden
                    ? undefined
                    : createLinkColumn<EntryFields, string>(
                        'event__crisis__name',
                        'Crisis',
                        (item) => ({
                            title: item.event?.crisis?.name,
                            attrs: { crisisId: item.event?.crisis?.id },
                        }),
                        route.crisis,
                        { sortable: true },
                    ),
                eventColumnHidden
                    ? undefined
                    : createLinkColumn<EntryFields, string>(
                        'event__name',
                        'Event',
                        (item) => ({
                            title: item.event?.name,
                            // FIXME: this may be wrong
                            attrs: { eventId: item.event?.id },
                        }),
                        route.event,
                        { sortable: true },
                    ),
                createLinkColumn<EntryFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.articleTitle,
                        attrs: { entryId: item.id },
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                createDateColumn<EntryFields, string>(
                    'publish_date',
                    'Publish Date',
                    (item) => item.publishDate,
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'publishers',
                    'Publishers',
                    (item) => item.publishers?.results?.map((p) => p.name).join(', '),
                ),
                createTextColumn<EntryFields, string>(
                    'sources',
                    'Sources',
                    (item) => item.sources?.results?.map((s) => s.name).join(', '),
                ),
                createTextColumn<EntryFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.event.eventType,
                    { sortable: true },
                ),
                createNumberColumn<EntryFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                    { sortable: true },
                ),
                createNumberColumn<EntryFields, string>(
                    'total_stock_idp_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                    { sortable: true },
                ),
                createStatusColumn<EntryFields, string>(
                    'status',
                    '',
                    (item) => ({
                        isReviewed: item.isReviewed,
                        isSignedOff: item.isSignedOff,
                        isUnderReview: item.isUnderReview,
                    }),
                ),
                actionColumn,
            ].filter(isDefined);
        },
        [
            handleEntryDelete,
            handleRowExpand,
            expandedRow,
            crisisColumnHidden, eventColumnHidden,
            entryPermissions?.delete,
        ],
    );

    const totalEntriesCount = entriesData?.entryList?.totalCount ?? 0;

    return (
        <>
            {totalEntriesCount > 0 && (
                <Table
                    className={className}
                    data={entriesData?.entryList?.results}
                    keySelector={keySelector}
                    columns={columns}
                    rowModifier={rowModifier}
                    resizableColumn
                    fixedColumnWidth
                />
            )}
            {(loadingEntries || deletingEntry) && <Loading absolute />}
            {!loadingEntries && totalEntriesCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </>
    );
}
export default NudeEntryTable;
