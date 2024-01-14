import React, { useMemo, useCallback, useContext, useState } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
    ConfirmButton,
    Pager,
} from '@togglecorp/toggle-ui';

import TableMessage from '#components/TableMessage';
import Mounter from '#components/Mounter';
import {
    createTextColumn,
    createLinkColumn,
    createDateColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import {
    ExportEntriesMutation,
    ExportEntriesMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    ExtractionEntryListFiltersQuery,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
} from '#generated/types';
import { hasNoData } from '#utils/common';

import route from '#config/routes';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

export const EXTRACTION_ENTRY_LIST = gql`
    query ExtractionEntryListFilters(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: EntryExtractionFilterDataInputType,
    ) {
        entryList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
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

const ENTRIES_EXPORT = gql`
    mutation ExportEntries(
        $filters: EntryExtractionFilterDataInputType!,
    ) {
        exportEntries(
            filters: $filters,
        ) {
            errors
            ok
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

type EntryFields = NonNullable<NonNullable<ExtractionEntryListFiltersQuery['entryList']>['results']>[number];

const keySelector = (item: EntryFields) => item.id;

interface Props {
    className?: string;
    filters?: ExtractionEntryListFiltersQueryVariables;

    page: number;
    pageSize: number;
    onPageChange: (value: number) => void;
    onPageSizeChange: (value: number) => void;
    pagerPageControlDisabled?: boolean;
}

function useEntryTable(props: Props) {
    const {
        className,
        filters,

        page,
        pageSize,
        onPageChange,
        onPageSizeChange,
        pagerPageControlDisabled,
    } = props;

    const [mounted, setMounted] = useState(false);

    const {
        previousData,
        data: entriesData = previousData,
        loading: loadingEntries,
        refetch: refetchEntries,
        error: entriesError,
    // eslint-disable-next-line max-len
    } = useQuery<ExtractionEntryListFiltersQuery, ExtractionEntryListFiltersQueryVariables>(EXTRACTION_ENTRY_LIST, {
        variables: filters,
        skip: !mounted,
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

    const [
        exportEntries,
        { loading: exportingTableData },
    ] = useMutation<ExportEntriesMutation, ExportEntriesMutationVariables>(
        ENTRIES_EXPORT,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportEntries: exportEntriesResponse } = response;
                if (!exportEntriesResponse) {
                    return;
                }
                const { errors, ok } = exportEntriesResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
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

    const handleExportTableData = useCallback(
        () => {
            exportEntries({
                variables: {
                    filters: filters?.filters ?? {},
                },
            });
        },
        [exportEntries, filters],
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

    const queryBasedEntryList = entriesData?.entryList?.results;
    const totalEntriesCount = entriesData?.entryList?.totalCount ?? 0;

    return {
        exportButton: (
            <ConfirmButton
                confirmationHeader="Confirm Export"
                confirmationMessage="Are you sure you want to export this table data?"
                name={undefined}
                onConfirm={handleExportTableData}
                disabled={exportingTableData}
            >
                Export
            </ConfirmButton>
        ),
        pager: (
            <Pager
                activePage={page}
                itemsCount={totalEntriesCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={onPageChange}
                onItemsPerPageChange={onPageSizeChange}
                itemsPerPageControlHidden={pagerPageControlDisabled}
            />
        ),
        table: (
            <>
                <Mounter
                    onChange={setMounted}
                />
                {(loadingEntries || deletingEntry) && <Loading absolute />}
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
                {!loadingEntries && (
                    <TableMessage
                        errored={!!entriesError}
                        filtered={!hasNoData(filters?.filters)}
                        totalItems={totalEntriesCount}
                        emptyMessage="No entries found"
                        emptyMessageWithFilters="No entries found with applied filters"
                        errorMessage="Could not fetch entries"
                    />
                )}
            </>
        ),
    };
}
export default useEntryTable;
