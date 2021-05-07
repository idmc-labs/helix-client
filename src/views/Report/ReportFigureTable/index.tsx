import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    createDateColumn,
    createNumberColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    // createStatusColumn,
} from '#components/tableHelpers';

import route from '#config/routes';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import {
    FigureEntriesListQuery,
    FigureEntriesListQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_REPORT_FIGURES = gql`
    query FigureEntriesList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            figuresReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    id
                    createdAt
                    createdBy {
                        id
                        fullName
                    }
                    category {
                        id
                        name
                    }
                    country {
                        id
                        name
                    }
                    entry {
                        id
                        articleTitle
                        event {
                            id
                            name
                            crisis {
                                id
                                name
                            }
                        }
                    }
                    role
                    totalFigures
                    term {
                        id
                        name
                    }
                    endDate
                    startDate
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

type ReportFigureFields = NonNullable<NonNullable<NonNullable<FigureEntriesListQuery['report']>['figuresReport']>['results']>[number];

const keySelector = (item: ReportFigureFields) => item.id;

interface ReportFigureProps {
    className?: string;
    report: string;
    heading?: React.ReactNode;
}

function ReportFigureTable(props: ReportFigureProps) {
    const {
        className,
        report,
        heading = 'Figures',
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
        (): FigureEntriesListQueryVariables => ({
            ordering,
            page,
            pageSize,
            report,
        }),
        [ordering, page, pageSize, report],
    );

    const {
        previousData,
        data: reportFigures = previousData,
        loading: reportFiguresLoading,
        // TODO: handle error
    } = useQuery<FigureEntriesListQuery>(GET_REPORT_FIGURES, { variables });

    const loading = reportFiguresLoading;
    const totalReportFiguresCount = reportFigures?.report?.figuresReport?.totalCount ?? 0;

    const reportFigureColumns = useMemo(
        () => ([
            createDateColumn<ReportFigureFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createLinkColumn<ReportFigureFields, string>(
                'entry__event__crisis__name',
                'Crisis',
                (item) => ({
                    title: item.entry.event?.crisis?.name,
                    attrs: { crisisId: item.entry.event?.crisis?.id },
                }),
                route.crisis,
                { sortable: true },
            ),
            createLinkColumn<ReportFigureFields, string>(
                'entry__event__name',
                'Event',
                (item) => ({
                    title: item.entry.event?.name,
                    // FIXME: this may be wrong
                    attrs: { eventId: item.entry.event?.id },
                }),
                route.event,
                { sortable: true },
            ),
            createLinkColumn<ReportFigureFields, string>(
                'entry__article_title',
                'Entry',
                (item) => ({
                    title: item.entry.articleTitle,
                    attrs: { entryId: item.entry.id },
                }),
                route.entryView,
                { cellAsHeader: true, sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'country__name',
                'Country',
                (item) => item.country?.name,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'term__name',
                'Term',
                (item) => item.term?.name,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'role',
                'Role',
                (item) => item.role,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'category__name',
                'Figure Type',
                (item) => item.category?.name,
                { sortable: true },
            ),
            createNumberColumn<ReportFigureFields, string>(
                'total_figures',
                'Total Figure',
                (item) => item.totalFigures,
                { sortable: true },
            ),
            createDateColumn<ReportFigureFields, string>(
                'start_date',
                'Start Date',
                (item) => item.startDate,
                { sortable: true },
            ),
            createDateColumn<ReportFigureFields, string>(
                'end_date',
                'End Date',
                (item) => item.endDate,
                { sortable: true },
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
                    itemsCount={totalReportFiguresCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReportFiguresCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={reportFigures?.report?.figuresReport?.results}
                        keySelector={keySelector}
                        columns={reportFigureColumns}
                    />
                </SortContext.Provider>
            )}
            {loading && <Loading absolute />}
            {!reportFiguresLoading && totalReportFiguresCount <= 0 && (
                <Message
                    message="No figures found."
                />
            )}
        </Container>
    );
}

export default ReportFigureTable;
