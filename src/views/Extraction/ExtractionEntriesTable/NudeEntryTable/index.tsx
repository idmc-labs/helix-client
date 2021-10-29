import React, { useMemo, useCallback, useContext, useEffect } from 'react';
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
    ExtractionEntryListFiltersQueryVariables,
    ExtractionEntryListFiltersQuery,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
} from '#generated/types';

import route from '#config/routes';

// FIXME: add more filters for date aggregates
export const EXTRACTION_ENTRY_LIST = gql`
    query ExtractionEntryListFilters(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filterEntryArticleTitle: String,
        $filterEntryCreatedBy: [ID!],
        $filterEntryHasReviewComments: Boolean,
        $filterEntryPublishers: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntrySources: [ID!],
        $filterEventCrises: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventGlideNumber: [String!],
        $filterFigureCategories: [ID!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureEndBefore: Date,
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureRegions: [ID!],
        $filterFigureRoles: [String!],
        $filterFigureSexTypes: [String!],
        $filterFigureStartAfter: Date,
        $filterFigureTags: [ID!],
        $filterFigureTerms: [ID!],
        $filterEvents: [ID!],
    ) {
        extractionEntryList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterEntryHasReviewComments: $filterEntryHasReviewComments,
            filterEntryPublishers: $filterEntryPublishers,
            filterEntryReviewStatus: $filterEntryReviewStatus,
            filterEntrySources: $filterEntrySources,
            filterEventCrises: $filterEventCrises,
            filterEventCrisisTypes: $filterEventCrisisTypes,
            filterEventGlideNumber: $filterEventGlideNumber,
            filterFigureCategories: $filterFigureCategories,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureRegions: $filterFigureRegions,
            filterFigureRoles: $filterFigureRoles,
            filterFigureSexTypes: $filterFigureSexTypes,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureTags: $filterFigureTags,
            filterFigureTerms: $filterFigureTerms,
            filterEvents: $filterEvents,
        ) {
            page
            pageSize
            totalCount
            results {
                articleTitle
                createdAt
                id
                oldId
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
                    oldId
                    name
                    eventType
                    crisis {
                        id
                        name
                    }
                    countries {
                        id
                        idmcShortName
                    }
                }
                totalStockIdpFigures(data: {
                    categories: $filterFigureCategories,
                    roles: $filterFigureRoles,
                    filterFigureStartAfter: $filterFigureStartAfter,
                    filterFigureEndBefore: $filterFigureEndBefore,
                }),
                totalFlowNdFigures(data: {
                    categories: $filterFigureCategories,
                    roles: $filterFigureRoles,
                    filterFigureStartAfter: $filterFigureStartAfter,
                    filterFigureEndBefore: $filterFigureEndBefore,
                })
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

type EntryFields = NonNullable<NonNullable<ExtractionEntryListFiltersQuery['extractionEntryList']>['results']>[number];

const keySelector = (item: EntryFields) => item.id;

interface NudeEntryTableProps {
    className?: string;
    filters?: ExtractionEntryListFiltersQueryVariables;
    onTotalEntriesChange?: (value: number) => void;
}

function NudeEntryTable(props: NudeEntryTableProps) {
    const {
        className,
        filters,
        onTotalEntriesChange,
    } = props;

    const {
        previousData,
        data: entriesData = previousData,
        loading: loadingEntries,
        refetch: refetchEntries,
        // eslint-disable-next-line max-len
    } = useQuery<ExtractionEntryListFiltersQuery, ExtractionEntryListFiltersQueryVariables>(EXTRACTION_ENTRY_LIST, {
        variables: filters,
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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
                if (errors) {
                    notifyGQLError(errors);
                } else {
                    refetchEntries(filters);
                    notify({
                        children: 'Entry deleted successfully!',
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

    const handleEntryDelete = useCallback(
        (id: string) => {
            deleteEntry({
                variables: { id },
            });
        },
        [deleteEntry],
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
                createDateColumn<EntryFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                createLinkColumn<EntryFields, string>(
                    'event__crisis__name',
                    'Crisis',
                    (item) => ({
                        title: item.event?.crisis?.name,
                        attrs: { crisisId: item.event?.crisis?.id },
                        ext: undefined,
                    }),
                    route.crisis,
                    { sortable: true },
                ),
                createLinkColumn<EntryFields, string>(
                    'event__name',
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
                createStatusColumn<EntryFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.articleTitle,
                        attrs: { entryId: item.id },
                        isReviewed: item.isReviewed,
                        isSignedOff: item.isSignedOff,
                        isUnderReview: item.isUnderReview,
                        ext: item?.oldId
                            ? `/documents/${item.oldId}`
                            : undefined,
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                createDateColumn<EntryFields, string>(
                    'publish_date',
                    'Publish Date',
                    (item) => item.publishDate,
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'publishers__name',
                    'Publishers',
                    (item) => item.publishers?.results?.map((p) => p.name).join(', '),
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'sources__name',
                    'Sources',
                    (item) => item.sources?.results?.map((s) => s.name).join(', '),
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.event.eventType,
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'event__countries__idmc_short_name',
                    'Countries',
                    (item) => item.event.countries.map((c) => c.idmcShortName).join(', '),
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
                actionColumn,
            ].filter(isDefined);
        },
        [
            handleEntryDelete,
            entryPermissions?.delete,
        ],
    );

    const queryBasedEntryList = entriesData?.extractionEntryList?.results;
    const totalEntriesCount = entriesData?.extractionEntryList?.totalCount ?? 0;

    // NOTE: if we don't pass total figures count this way,
    // we will have to use Portal to move the Pager component
    useEffect(
        () => {
            if (onTotalEntriesChange) {
                onTotalEntriesChange(totalEntriesCount);
            }
        },
        [onTotalEntriesChange, totalEntriesCount],
    );

    return (
        <>
            {totalEntriesCount > 0 && (
                <Table
                    className={className}
                    data={queryBasedEntryList}
                    keySelector={keySelector}
                    columns={columns}
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
