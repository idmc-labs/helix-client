import React, { useState, useMemo, useContext, useCallback } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';

import {
    createTextColumn,
    createLinkColumn,
    createStatusColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import NotificationContext from '#components/NotificationContext';

import route from '#config/routes';
import useDebouncedValue from '#hooks/useDebouncedValue';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import {
    ReportFiguresListQuery,
    ReportFiguresListQueryVariables,
    ExportFiguresReportMutation,
    ExportFiguresReportMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_REPORT_FIGURES = gql`
    query ReportFiguresList(
        $report: ID!,
        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        report(id: $report) {
            id
            figuresReport(
                ordering: $ordering,
                page: $page,
                pageSize: $pageSize,
            ) {
                totalCount
                results {
                    id
                    oldId
                    createdAt
                    createdBy {
                        id
                        fullName
                    }
                    category
                    categoryDisplay
                    country {
                        id
                        idmcShortName
                    }
                    entry {
                        id
                        oldId
                        articleTitle
                        isReviewed
                        isSignedOff
                        isUnderReview
                    }
                    event {
                        id
                        oldId
                        name
                        eventType
                        eventTypeDisplay
                        crisis {
                            id
                            name
                        }
                    }
                    figureTypology
                    role
                    roleDisplay
                    totalFigures
                    term
                    termDisplay
                    flowEndDate
                    flowStartDate
                    stockDate
                    stockReportingDate
                }
                page
                pageSize
            }
        }
    }
`;

export const FIGURES_DOWNLOAD = gql`
    mutation ExportFiguresReport(
        $report: String,
    ) {
        exportFigures(
            report: $report,
        ) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'created_at',
    direction: 'asc',
};

type ReportFigureFields = NonNullable<NonNullable<NonNullable<ReportFiguresListQuery['report']>['figuresReport']>['results']>[number];

const keySelector = (item: ReportFigureFields) => item.id;

interface ReportFigureProps {
    className?: string;
    report: string;
    tabs?: React.ReactNode;
}

function ReportFigureTable(props: ReportFigureProps) {
    const {
        className,
        report,
        tabs,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const variables = useMemo(
        (): ReportFiguresListQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
            report,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
            report,
        ],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const {
        previousData,
        data: reportFigures = previousData,
        loading: reportFiguresLoading,
        // TODO: handle error
    } = useQuery<ReportFiguresListQuery>(GET_REPORT_FIGURES, { variables });

    const [
        exportFigures,
        { loading: exportingFigures },
    ] = useMutation<ExportFiguresReportMutation, ExportFiguresReportMutationVariables>(
        FIGURES_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportFigures: exportFiguresResponse } = response;
                if (!exportFiguresResponse) {
                    return;
                }
                const { errors, ok } = exportFiguresResponse;
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

    const handleExportFiguresData = React.useCallback(
        () => {
            exportFigures({ variables: { report } });
        },
        [exportFigures, report],
    );

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
            createTextColumn<ReportFigureFields, string>(
                'entry__event__event_type',
                'Cause',
                (item) => item.event?.eventTypeDisplay,
            ),
            createTextColumn<ReportFigureFields, string>(
                'figure_typology',
                'Figure Type',
                (item) => item.figureTypology,
            ),
            createStatusColumn<ReportFigureFields, string>(
                'entry__article_title',
                'Entry',
                (item) => ({
                    title: item.entry.articleTitle,
                    attrs: { entryId: item.entry.id },
                    isReviewed: item.entry.isReviewed,
                    isSignedOff: item.entry.isSignedOff,
                    isUnderReview: item.entry.isUnderReview,
                    ext: item.entry.oldId
                        ? `/documents/${item.entry.oldId}`
                        : undefined,
                    hash: '/figures-and-analysis',
                    search: `id=${item.id}`,
                }),
                route.entryView,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'country__idmc_short_name',
                'Country',
                (item) => item.country?.idmcShortName,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'term',
                'Term',
                (item) => item.termDisplay,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'role',
                'Role',
                (item) => item.roleDisplay,
                { sortable: true },
            ),
            createLinkColumn<ReportFigureFields, string>(
                'category',
                'Figure Category',
                (item) => ({
                    title: item.categoryDisplay,
                    attrs: { entryId: item.entry.id },
                    ext: item.oldId
                        ? `/facts/${item.oldId}`
                        : undefined,
                    hash: '/figures-and-analysis',
                    search: `id=${item.id}`,
                }),
                route.entryView,
                { sortable: true },
            ),
            createNumberColumn<ReportFigureFields, string>(
                'total_figures',
                'Total Figure',
                (item) => item.totalFigures,
                { sortable: true },
            ),
            createDateColumn<ReportFigureFields, string>(
                'flow_start_date',
                'Start Date',
                (item) => item.flowStartDate,
                { sortable: true },
            ),
            createDateColumn<ReportFigureFields, string>(
                'flow_end_date',
                'End Date',
                (item) => item.flowEndDate,
                { sortable: true },
            ),
            createDateColumn<ReportFigureFields, string>(
                'stock_date',
                'Stock Date',
                (item) => item.stockDate,
                { sortable: true },
            ),
            createDateColumn<ReportFigureFields, string>(
                'stock_reporting_date',
                'Stock Reporting Date',
                (item) => item.stockReportingDate,
                { sortable: true },
            ),
            createLinkColumn<ReportFigureFields, string>(
                'event__name',
                'Event',
                (item) => ({
                    title: item.event?.name,
                    attrs: { eventId: item.event?.id },
                    ext: item.event?.oldId
                        ? `/events/${item.event.oldId}`
                        : undefined,
                }),
                route.event,
                { sortable: true },
            ),
            createLinkColumn<ReportFigureFields, string>(
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
        ]),
        [],
    );

    return (
        <Container
            tabs={tabs}
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <ConfirmButton
                        confirmationHeader="Export"
                        confirmationMessage="Are you sure you want to export figures?"
                        name={undefined}
                        onConfirm={handleExportFiguresData}
                        disabled={exportingFigures}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalReportFiguresCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
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
                        resizableColumn
                        fixedColumnWidth
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
