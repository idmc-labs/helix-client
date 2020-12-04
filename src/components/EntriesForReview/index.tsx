import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    isDefined,
    _cs,
} from '@togglecorp/fujs';
import {
    TableCellProps,
    TableCell,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    TableSortParameter,
    Pager,
} from '@togglecorp/toggle-ui';

import route from '#config/routes';
import Container from '#components/Container';
import Loading from '#components/Loading';
import DateCell from '#components/tableHelpers/Date';
import ExternalLinkCell, { ExternalLinkProps } from '#components/tableHelpers/ExternalLink';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';

import { ExtractKeys } from '#types';

import {
    MyEntryListForReviewQuery,
    MyEntryListForReviewQueryVariables,
} from '#generated/types';

import ActionCell, { ActionProps } from './Actions';
import styles from './styles.css';

const MY_ENTRY_LIST_FOR_REVIEW = gql`
query MyEntryListForReview($ordering: String, $page: Int, $pageSize: Int) {
    me {
        reviewEntries(ordering: $ordering, page: $page, pageSize: $pageSize) {
            totalCount
            page
            pageSize
            results {
                id
                articleTitle
                createdBy {
                    fullName
                }
                publishDate
                publisher {
                    id
                    name
                }
                source {
                    id
                    name
                }
                url
                event {
                    id
                    name
                    crisis {
                        id
                        name
                    }
                }
            }
        }
    }
}`;

type EntryFields = NonNullable<NonNullable<NonNullable<MyEntryListForReviewQuery['me']>['reviewEntries']>['results']>[number];

const entriesDefaultSortState: TableSortParameter = {
    name: 'publishDate',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: EntryFields) => item.id;

interface EntriesForReviewProps {
    sortState?: TableSortParameter;
    page?: number;
    pageSize?: number;
    heading?: string;
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;
}

function EntriesForReview(props: EntriesForReviewProps) {
    const {
        sortState: defaultSortState = entriesDefaultSortState,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 25,
        heading = 'Entries',
        className,
        eventColumnHidden,
        crisisColumnHidden,
    } = props;
    const { sortState, setSortState } = useSortState();
    const validSortState = sortState ?? defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const crisesVariables = useMemo(
        (): MyEntryListForReviewQueryVariables => ({
            ordering,
            page,
            pageSize,
        }),
        [ordering, page, pageSize],
    );

    // FIXME: handle error!
    const {
        data: myEntryListForReview,
        loading: loadingEntries,
    } = useQuery<MyEntryListForReviewQuery, MyEntryListForReviewQueryVariables>(
        MY_ENTRY_LIST_FOR_REVIEW, {
            variables: crisesVariables,
        },
    );

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<EntryFields, string>;

            // Generic columns
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: EntryFields) => ({
                    value: datum[colName],
                }),
            });

            // Specific columns

            // eslint-disable-next-line max-len
            const articleTitleColumn: TableColumn<EntryFields, string, ExternalLinkProps, TableHeaderCellProps> = {
                id: 'articleTitle',
                title: 'Title',
                cellAsHeader: true,
                cellContainerClassName: styles.articleTitle,
                headerContainerClassName: styles.articleTitle,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'articleTitle'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: ExternalLinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.articleTitle,
                    link: datum.url,
                }),
            };

            // eslint-disable-next-line max-len
            const eventColumn: TableColumn<EntryFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'event',
                title: 'Event',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'event'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.event?.name,
                    route: route.event,
                    attrs: { eventId: datum.event.id },
                }),
            };

            // eslint-disable-next-line max-len
            const crisisColumn: TableColumn<EntryFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'crisis',
                title: 'Crisis',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'crisis'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.event.crisis?.name,
                    route: route.crisis,
                    attrs: { crisisId: datum.event.crisis?.id },
                }),
            };
            // eslint-disable-next-line max-len
            const createdByColumn: TableColumn<EntryFields, string, TableCellProps<React.ReactNode>, TableHeaderCellProps> = {
                id: 'createdBy',
                title: 'Created By',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_, datum) => ({
                    value: datum.createdBy?.fullName,
                }),
            };

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
                    viewLinkRoute: route.entryReview,
                    viewLinkAttrs: { entryId: datum.id },
                }),
            };

            return [
                createColumn(dateColumn, 'publishDate', 'Publish Date'),
                createdByColumn,
                crisisColumnHidden ? undefined : crisisColumn,
                eventColumnHidden ? undefined : eventColumn,
                articleTitleColumn,
                actionColumn,
            ].filter(isDefined);
        },
        [
            setSortState, validSortState,
            crisisColumnHidden, eventColumnHidden,
        ],
    );

    // FIXME: only pull entries with review status != complete
    const nonReviewedCrisesData = myEntryListForReview?.me?.reviewEntries?.results;

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.entriesTable)}
            footerContent={nonReviewedCrisesData && (
                <Pager
                    activePage={page}
                    itemsCount={myEntryListForReview?.me?.reviewEntries?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {nonReviewedCrisesData && (
                <Table
                    className={styles.table}
                    data={nonReviewedCrisesData}
                    keySelector={keySelector}
                    columns={columns}
                />
            )}
            {!loadingEntries && !nonReviewedCrisesData && (
                <div className={styles.noReview}>
                    No Entries to review!
                </div>
            )}
            {loadingEntries && <Loading />}
        </Container>
    );
}
export default EntriesForReview;
