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
import Message from '#components/Message';

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
        reviewing(ordering: $ordering, page: $page, pageSize: $pageSize, statusIn: ["TO_BE_REVIEWED", "UNDER_REVIEW"]) {
            totalCount
            page
            pageSize
            results {
                createdAt
                id
                entry {
                    id
                    articleTitle
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
                createdBy {
                    fullName
                }
            }
        }
    }
}`;

type EntryFields = NonNullable<NonNullable<NonNullable<MyEntryListForReviewQuery['me']>['reviewing']>['results']>[number];

const entriesDefaultSortState: TableSortParameter = {
    name: 'createdAt',
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
        pageSize: defaultPageSize = 10,
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
                    title: datum.entry.articleTitle,
                    link: datum.entry.url,
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
                    title: datum.entry.event.name,
                    route: route.event,
                    attrs: { eventId: datum.entry.event.id },
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
                    title: datum.entry.event.crisis?.name,
                    route: route.crisis,
                    attrs: { crisisId: datum.entry.event.crisis?.id },
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
                    viewLinkAttrs: { entryId: datum.entry.id },
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Created Date'),
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

    const nonReviewedCrisesData = myEntryListForReview?.me?.reviewing?.results;
    const totalReviewListCount = myEntryListForReview?.me?.reviewing?.totalCount ?? 0;

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.entriesTable)}
            contentClassName={styles.content}
            footerContent={totalReviewListCount > 0 && (
                <Pager
                    activePage={page}
                    itemsCount={totalReviewListCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReviewListCount > 0 && (
                <Table
                    className={styles.table}
                    data={nonReviewedCrisesData}
                    keySelector={keySelector}
                    columns={columns}
                />
            )}
            {!loadingEntries && totalReviewListCount <= 0 && (
                <Message
                    message="No entries to review."
                />
            )}
            {loadingEntries && <Loading />}
        </Container>
    );
}
export default EntriesForReview;
