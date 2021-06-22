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
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    SortContext,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import {
    createStatusColumn,
    createLinkColumn,
    createTextColumn,
} from '#components/tableHelpers';

import route from '#config/routes';
import Container from '#components/Container';
import Loading from '#components/Loading';
import Message from '#components/Message';

import {
    MyEntryListForReviewQuery,
    MyEntryListForReviewQueryVariables,
} from '#generated/types';

import ActionCell, { ActionProps } from './Actions';
import styles from './styles.css';

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}

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
                    isReviewed
                    isSignedOff
                    isUnderReview
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
                    createdBy {
                        id
                        fullName
                    }
                }
            }
        }
    }
}`;

type EntryFields = NonNullable<NonNullable<NonNullable<MyEntryListForReviewQuery['me']>['reviewing']>['results']>[number];

const entriesDefaultSorting = {
    name: 'created_at',
    direction: 'dsc',
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
        sortState: defaultSorting = entriesDefaultSorting,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 10,
        heading = 'Entries',
        className,
        eventColumnHidden,
        crisisColumnHidden,
    } = props;

    const sortState = useSortState();
    const { sorting } = useSortState();
    const validSorting = sorting ?? defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(defaultPage);
    const [pageSize] = useState(defaultPageSize);

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
        previousData,
        data: myEntryListForReview = previousData,
        loading: loadingEntries,
    } = useQuery<MyEntryListForReviewQuery, MyEntryListForReviewQueryVariables>(
        MY_ENTRY_LIST_FOR_REVIEW, {
            variables: crisesVariables,
        },
    );

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
                    viewLinkRoute: route.entryReview,
                    viewLinkAttrs: { entryId: datum.entry.id },
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
                    'entry__created_by__full_name',
                    'Created By',
                    (item) => item.entry.createdBy?.fullName,
                    { sortable: true },
                ),
                crisisColumnHidden
                    ? undefined
                    : createTextColumn<EntryFields, string>(
                        'entry__event__crisis__name',
                        'Crisis',
                        (item) => item.entry.event.crisis?.name,
                        { sortable: true },
                    ),
                eventColumnHidden
                    ? undefined
                    : createTextColumn<EntryFields, string>(
                        'entry__event__name',
                        'Event',
                        (item) => item.entry.event.name,
                        { sortable: true },
                    ),
                createLinkColumn<EntryFields, string>(
                    'entry__article_title',
                    'Entry',
                    (item) => ({
                        title: item.entry.articleTitle,
                        attrs: { entryId: item.entry.id },
                    }),
                    route.entryView,
                    { cellAsHeader: true, sortable: true },
                ),
                createStatusColumn<EntryFields, string>(
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
        [crisisColumnHidden, eventColumnHidden],
    );

    const nonReviewedCrisesData = myEntryListForReview?.me?.reviewing?.results;
    const totalReviewListCount = myEntryListForReview?.me?.reviewing?.totalCount ?? 0;

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.entriesTable)}
            contentClassName={styles.content}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalReviewListCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    // onItemsPerPageChange={setPageSize}
                    onItemsPerPageChange={undefined}
                    itemsPerPageControlHidden
                />
            )}
        >
            {totalReviewListCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={nonReviewedCrisesData}
                        keySelector={keySelector}
                        columns={columns}
                    />
                </SortContext.Provider>
            )}
            {!loadingEntries && totalReviewListCount <= 0 && (
                <Message
                    message="No entries to review."
                />
            )}
            {loadingEntries && <Loading absolute />}
        </Container>
    );
}
export default EntriesForReview;
