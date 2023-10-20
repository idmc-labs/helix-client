import React, { useMemo, useCallback, useContext, useEffect } from 'react'; import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createDateColumn,
    createCustomActionColumn,
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
        $filterCreatedBy: [ID!],
        $filterFigureCategories: [String!],
        $filterEntryPublishers: [ID!],
        $filterFigureSources: [ID!],
        $filterFigureCrises: [ID!],
        $filterFigureCrisisTypes: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureRegions: [ID!],
        $filterFigureRoles: [String!],
        $filterFigureHasDisaggregatedData: Boolean,
        $filterFigureStartAfter: Date,
        $filterFigureTags: [ID!],
        $filterFigureTerms: [ID!],
        $filterFigureEvents: [ID!],
        $filterFigureReviewStatus: [String!],
    ) {
        extractionEntryList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filterFigureCategories: $filterFigureCategories,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterCreatedBy: $filterCreatedBy,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureSources: $filterFigureSources,
            filterFigureCrises: $filterFigureCrises,
            filterFigureCrisisTypes: $filterFigureCrisisTypes,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureRegions: $filterFigureRegions,
            filterFigureRoles: $filterFigureRoles,
            filterFigureHasDisaggregatedData: $filterFigureHasDisaggregatedData,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureTags: $filterFigureTags,
            filterFigureTerms: $filterFigureTerms,
            filterFigureEvents: $filterFigureEvents,
            filterFigureReviewStatus: $filterFigureReviewStatus,
        ) {
            page
            pageSize
            totalCount
            results {
                articleTitle
                createdAt
                id
                oldId
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
                url
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
        () => ([
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
                'article_title',
                'Entry',
                (item) => ({
                    title: item.articleTitle,
                    attrs: { entryId: item.id },
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
            createCustomActionColumn<EntryFields, string, ActionProps>(
                ActionCell,
                (_, datum) => ({
                    id: datum.id,
                    deleteTitle: 'entry',
                    onDelete: entryPermissions?.delete ? handleEntryDelete : undefined,
                    editLinkRoute: route.entryEdit,
                    editLinkAttrs: { entryId: datum.id },
                }),
                'action',
                '',
                undefined,
                2,
            ),
        ].filter(isDefined)),
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
