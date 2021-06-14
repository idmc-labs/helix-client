import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    createDateColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createStatusColumn,
    createNumberColumn,
} from '#components/tableHelpers';

import route from '#config/routes';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import {
    ReportEntriesListQuery,
    ReportEntriesListQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_REPORT_ENTRIES_LIST = gql`
    query ReportEntriesList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            entriesReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    totalFlowNdFigures
                    totalStockIdpFigures
                    id
                    isReviewed
                    isSignedOff
                    isUnderReview
                    url
                    articleTitle
                    createdAt
                    createdBy {
                        fullName
                    }
                    publishDate
                    event {
                        id
                        name
                        crisis {
                            id
                            name
                        }
                    }
                }
                page
                pageSize
            }
        }
    }
`;

const defaultSorting = {
    name: 'created_at',
    direction: 'asc',
};

type ReportEntryFields = NonNullable<NonNullable<NonNullable<ReportEntriesListQuery['report']>['entriesReport']>['results']>[number];

const keySelector = (item: ReportEntryFields) => item.id;

interface ReportEntryProps {
    className?: string;
    report: string;
    heading?: React.ReactNode;
}

function ReportEntryTable(props: ReportEntryProps) {
    const {
        className,
        report,
        heading = 'Entries',
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): ReportEntriesListQueryVariables => ({
            ordering,
            page,
            pageSize,
            report,
        }),
        [ordering, page, pageSize, report],
    );

    const {
        previousData,
        data: reportEntries = previousData,
        loading: reportEntriesLoading,
        // TODO: handle error
    } = useQuery<ReportEntriesListQuery>(GET_REPORT_ENTRIES_LIST, { variables });

    const loading = reportEntriesLoading;
    const totalReportEntriesCount = reportEntries?.report?.entriesReport?.totalCount ?? 0;

    const reportEntryColumns = useMemo(
        () => ([
            createDateColumn<ReportEntryFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<ReportEntryFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createLinkColumn<ReportEntryFields, string>(
                'event__crisis__name',
                'Crisis',
                (item) => ({
                    title: item.event?.crisis?.name,
                    attrs: { crisisId: item.event?.crisis?.id },
                }),
                route.crisis,
                { sortable: true },
            ),
            createLinkColumn<ReportEntryFields, string>(
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
            createLinkColumn<ReportEntryFields, string>(
                'article_title',
                'Entry',
                (item) => ({
                    title: item.articleTitle,
                    attrs: { entryId: item.id },
                }),
                route.entryView,
                { cellAsHeader: true, sortable: true },
            ),
            createDateColumn<ReportEntryFields, string>(
                'publish_date',
                'Publish Date',
                (item) => item.publishDate,
                { sortable: true },
            ),
            createNumberColumn<ReportEntryFields, string>(
                'total_flow_nd_figures',
                'New Displacements',
                (item) => item.totalFlowNdFigures,
                { sortable: true },
            ),
            createNumberColumn<ReportEntryFields, string>(
                'total_stock_idp_figures',
                'No. of IDPs',
                (item) => item.totalStockIdpFigures,
                { sortable: true },
            ),
            createStatusColumn<ReportEntryFields, string>(
                'status',
                '',
                (item) => ({
                    isReviewed: item.isReviewed,
                    isSignedOff: item.isSignedOff,
                    isUnderReview: item.isUnderReview,
                }),
            ),
        ]),
        [],
    );

    return (
        <Container
            heading={heading}
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalReportEntriesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReportEntriesCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={reportEntries?.report?.entriesReport?.results}
                        keySelector={keySelector}
                        columns={reportEntryColumns}
                    />
                </SortContext.Provider>
            )}
            {loading && <Loading absolute />}
            {!reportEntriesLoading && totalReportEntriesCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </Container>
    );
}

export default ReportEntryTable;
