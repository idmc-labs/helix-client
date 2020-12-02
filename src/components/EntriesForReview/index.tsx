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

import Container from '#components/Container';
import Loading from '#components/Loading';
import DateCell from '#components/tableHelpers/Date';
import ExternalLinkCell, { ExternalLinkProps } from '#components/tableHelpers/ExternalLink';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';

import { ExtractKeys } from '#types';

import {
    EntriesForReviewQuery,
    EntriesForReviewQueryVariables,
} from '#generated/types';

import ActionCell, { ActionProps } from './Actions';
import styles from './styles.css';

// TODO: Fix in Backend. countries is [String] but only takes a single string
const ENTRY_LIST_FOR_REVIEW = gql`
query EntriesForReview($ordering: String, $page: Int, $pageSize: Int, $text: String, $event: ID, $countries: [String], $reviewers: [ID]) {
    entryList(ordering: $ordering, page: $page, pageSize: $pageSize, articleTitleContains: $text, event: $event, countries: $countries, reviewers: $reviewers) {
            page
            pageSize
            totalCount
            results {
                articleTitle
                createdAt
                id
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
                totalFigures
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
`;

type EntryFields = NonNullable<NonNullable<EntriesForReviewQuery['entryList']>['results']>[number];

const defaultDefaultSortState: TableSortParameter = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: EntryFields) => item.id;

interface EntriesForReviewProps {
    sortState?: TableSortParameter;
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    searchDisabled?: boolean;
    heading?: string;
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    country?: string;
}

function EntriesForReview(props: EntriesForReviewProps) {
    const [search, setSearch] = useState<string | undefined>();

    const {
        sortState: defaultSortState = defaultDefaultSortState,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 25,
        pagerDisabled,
        searchDisabled,
        heading = 'Entries',
        className,
        eventColumnHidden,
        crisisColumnHidden,

        eventId,
        userId,
        country,
    } = props;
    const { sortState, setSortState } = useSortState();
    const validSortState = sortState ?? defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const crisesVariables = useMemo(
        (): EntriesForReviewQueryVariables => ({
            ordering,
            page,
            pageSize,
            text: search,
            event: eventId,
            reviewers: userId ? [userId] : undefined,
            countries: country ? [country] : undefined,
        }),
        [ordering, page, pageSize, search, eventId, userId, country],
    );

    const {
        data: crisesData,
        loading: loadingCrises,
    } = useQuery<EntriesForReviewQuery, EntriesForReviewQueryVariables>(ENTRY_LIST_FOR_REVIEW, {
        variables: crisesVariables,
    });

    const nonReviewedCrisesData = useMemo(() => {
        const results = crisesData?.entryList?.results;
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
    }, [crisesData]);

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
                    /* FIXME: use pathnames and substitution */
                    link: datum.url,
                }),
            };

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
                    link: `/events/${datum.event?.id}/`,
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
                    title: datum.event?.crisis?.name,
                    link: `/crises/${datum.event?.crisis?.id}/`,
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
                    id: datum.id,
                    viewLink: `/entries/${datum.id}/review/`,
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
            headerActions={!!nonReviewedCrisesData && (
                <TextInput
                    icons={<IoIosSearch />}
                    name="search"
                    value={search}
                    placeholder="Search"
                    onChange={setSearch}
                />
            )}
            footerContent={!pagerDisabled && (
                <Pager
                    activePage={page}
                    itemsCount={crisesData?.entryList?.totalCount ?? 0}
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
