import React, { useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    createDateColumn,
    SortContext,
    ConfirmButton,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';

import {
    createTextColumn,
    createLinkColumn,
    createStatusColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Downloads';
import NotificationContext from '#components/NotificationContext';

import route from '#config/routes';
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
    query ReportFiguresList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
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
                            eventType
                            crisis {
                                id
                                name
                            }
                        }
                        isReviewed
                        isSignedOff
                        isUnderReview
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

export const FIGURES_DOWNLOAD = gql`
    mutation ExportFiguresReport(
        $filterFigureStartAfter: Date,
        $filterFigureRoles: [String!],
        $filterFigureRegions: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureCountries: [ID!],
        $filterFigureCategories: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventCrises: [ID!],
        $filterEntryTags: [ID!],
        $filterEntryArticleTitle: String,
        $report: String,
        $filterEvents: [ID!]
    ) {
       exportFigures(
        filterFigureStartAfter: $filterFigureStartAfter,
        filterFigureRoles: $filterFigureRoles,
        filterFigureRegions: $filterFigureRegions,
        filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
        filterFigureEndBefore: $filterFigureEndBefore,
        filterFigureCountries: $filterFigureCountries,
        filterFigureCategories: $filterFigureCategories,
        filterEventCrisisTypes: $filterEventCrisisTypes,
        filterEventCrises: $filterEventCrises,
        filterEntryTags: $filterEntryTags,
        filterEntryArticleTitle: $filterEntryArticleTitle,
        report: $report,
        filterEvents: $filterEvents
        ){
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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): ReportFiguresListQueryVariables => ({
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
                    notify({ children: 'Export started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
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
            createLinkColumn<ReportFigureFields, string>(
                'entry__event__crisis__name',
                'Crisis',
                (item) => ({
                    title: item.entry.event.crisis?.name,
                    attrs: { crisisId: item.entry.event.crisis?.id },
                }),
                route.crisis,
                { sortable: true },
            ),
            createLinkColumn<ReportFigureFields, string>(
                'entry__event__name',
                'Event',
                (item) => ({
                    title: item.entry.event?.name,
                    attrs: { eventId: item.entry.event.id },
                }),
                route.event,
                { sortable: true },
            ),
            createTextColumn<ReportFigureFields, string>(
                'entry__event__event_type',
                'Cause',
                (item) => item.entry.event.eventType,
            ),
            createLinkColumn<ReportFigureFields, string>(
                'entry__article_title',
                'Entry',
                (item) => ({
                    title: item.entry.articleTitle,
                    attrs: { entryId: item.entry.id },
                }),
                route.entryView,
                { sortable: true },
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
            createStatusColumn<ReportFigureFields, string>(
                'status',
                '',
                (item) => ({
                    isReviewed: item.entry.isReviewed,
                    isSignedOff: item.entry.isSignedOff,
                    isUnderReview: item.entry.isUnderReview,
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
