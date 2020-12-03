import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { IoIosSearch } from 'react-icons/io';
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
    TextInput,
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
query MyEntryListForReview($ordering: String, $page: Int, $pageSize: Int, $text: String) {
    me {
        reviewEntries(ordering: $ordering, page: $page, pageSize: $pageSize, articleTitleContains: $text,) {
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
                reviewing {
                    status
                    id
                    reviewer {
                        id
                    }
                }
            }
        }
    }
}`;

type EntryFields = NonNullable<NonNullable<NonNullable<MyEntryListForReviewQuery['me']>['reviewEntries']>['results']>[number];

const defaultDefaultSortState: TableSortParameter = {
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
    userId?: string;
}

function EntriesForReview(props: EntriesForReviewProps) {
    const [search, setSearch] = useState<string | undefined>();

    const {
        sortState: defaultSortState = defaultDefaultSortState,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 25,
        heading = 'Entries',
        className,
        eventColumnHidden,
        crisisColumnHidden,
        userId,
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
            text: search,
        }),
        [ordering, page, pageSize, search],
    );

    const {
        data: myEntryListForReview,
        loading: loadingCrises,
    } = useQuery<MyEntryListForReviewQuery, MyEntryListForReviewQueryVariables>(
        MY_ENTRY_LIST_FOR_REVIEW, {
            variables: crisesVariables,
        },
    );

    // NOTE: this nonReviewedCrisesData should come from backend
    const nonReviewedCrisesData = useMemo(() => {
        const results = myEntryListForReview?.me?.reviewEntries?.results;
        if (!results) {
            return undefined;
        }
        const nonReviewed = results.map((result) => {
            const myReview = result.reviewing.find((rev) => rev.reviewer.id === userId);
            if (myReview?.status !== 'REVIEW_COMPLETED') {
                return result;
            }
            return undefined;
        }).filter(isDefined);

        if (nonReviewed.length <= 0) {
            return undefined;
        }

        return nonReviewed;
    }, [myEntryListForReview]);

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
            crisisColumnHidden, eventColumnHidden, userId,
        ],
    );

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.entriesTable)}
            headerActions={(!!nonReviewedCrisesData || !!search) && (
                <TextInput
                    icons={<IoIosSearch />}
                    name="search"
                    value={search}
                    placeholder="Search"
                    onChange={setSearch}
                />
            )}
            footerContent={!!nonReviewedCrisesData && (
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
            {!nonReviewedCrisesData && (
                <div className={styles.noReview}>
                    No Data To Review
                </div>
            )}
            {loadingCrises && <Loading />}
        </Container>
    );
}
export default EntriesForReview;
