import React, { useState, useMemo, useContext, useCallback } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { getOperationName } from 'apollo-link';
import {
    Table,
    useSortState,
    Pager,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createLinkColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import CountriesFilter from '../../Countries/CountriesFilter/index';

import useDebouncedValue from '#hooks/useDebouncedValue';
import route from '#config/routes';
import {
    ReportCountriesListQuery,
    ReportCountriesListQueryVariables,
    ExportCountriesReportMutation,
    ExportCountriesReportMutationVariables,
    CountriesQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_REPORT_COUNTRIES_LIST = gql`
    query ReportCountriesList(
        $report: ID!,
        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        report(id: $report) {
            id
            countriesReport(
                ordering: $ordering,
                page: $page,
                pageSize: $pageSize,
            ) {
                totalCount
                results {
                    totalFlowConflict
                    totalFlowDisaster
                    totalStockDisaster
                    totalStockConflict
                    id
                    iso3
                    idmcShortName
                    region {
                        id
                        name
                    }
                }
                page
                pageSize
            }
        }
    }
`;

const EXPORT_COUNTRY_REPORT = gql`
    mutation ExportCountriesReport(
        $report: String,
    ) {
        exportCountries(
            report: $report,
        ) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'name',
    direction: 'asc',
};

type ReportCountryFields = NonNullable<NonNullable<NonNullable<ReportCountriesListQuery['report']>['countriesReport']>['results']>[number];

const keySelector = (item: ReportCountryFields) => item.id;

interface ReportCountryProps {
    className?: string;
    report: string;
    tabs?: React.ReactNode;
}

function ReportCountryTable(props: ReportCountryProps) {
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

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const [
        countriesQueryFilters,
        setCountriesQueryFilters,
    ] = useState<PurgeNull<CountriesQueryVariables>>();

    const onFilterChange = useCallback(
        (value: PurgeNull<CountriesQueryVariables>) => {
            setCountriesQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const variables = useMemo(
        (): ReportCountriesListQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
            report,
            ...countriesQueryFilters,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
            report,
            countriesQueryFilters,
        ],
    );

    const {
        previousData,
        data: reportCountries = previousData,
        loading: reportCountriesLoading,
        // TODO: handle error
    } = useQuery<ReportCountriesListQuery>(GET_REPORT_COUNTRIES_LIST, { variables });

    const [
        exportCountries,
        { loading: exportingCountries },
    ] = useMutation<ExportCountriesReportMutation, ExportCountriesReportMutationVariables>(
        EXPORT_COUNTRY_REPORT,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportCountries: exportCountriesResponse } = response;
                if (!exportCountriesResponse) {
                    return;
                }
                const { errors, ok } = exportCountriesResponse;
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

    const handleExportTableData = React.useCallback(
        () => {
            exportCountries({ variables: { report } });
        },
        [exportCountries, report],
    );

    const { user } = useContext(DomainContext);
    const reportPermissions = user?.permissions?.report;

    const loading = reportCountriesLoading;
    const totalReportCountriesCount = reportCountries?.report?.countriesReport?.totalCount ?? 0;

    const reportCountryColumns = useMemo(
        () => ([
            createLinkColumn<ReportCountryFields, string>(
                'idmc_short_name',
                'Name',
                (item) => ({
                    title: item.idmcShortName,
                    attrs: { countryId: item.id },
                    ext: item.iso3
                        ? `/countries/profiles/${item.iso3}`
                        : undefined,
                }),
                route.country,
                { sortable: true },
            ),
            createTextColumn<ReportCountryFields, string>(
                'region__name',
                'Region',
                (item) => item.region?.name,
            ),
            createNumberColumn<ReportCountryFields, string>(
                'total_flow_conflict',
                'New Displacements (Conflict)',
                (item) => item.totalFlowConflict,
                { sortable: true },
            ),
            createNumberColumn<ReportCountryFields, string>(
                'total_stock_conflict',
                'No. of IDPs (Conflict)',
                (item) => item.totalStockConflict,
                { sortable: true },
            ),
            createNumberColumn<ReportCountryFields, string>(
                'total_flow_disaster',
                'New Displacements (Disaster)',
                (item) => item.totalFlowDisaster,
                { sortable: true },
            ),
            createNumberColumn<ReportCountryFields, string>(
                'total_stock_disaster',
                'No. of IDPs (Disaster)',
                (item) => item.totalStockDisaster,
                { sortable: true },
            ),
        ]),
        [],
    );

    return (
        <Container
            compactContent
            tabs={tabs}
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    {reportPermissions?.add && (
                        <>
                            <ConfirmButton
                                confirmationHeader="Confirm Export"
                                confirmationMessage="Are you sure you want to export this table data?"
                                name={undefined}
                                onConfirm={handleExportTableData}
                                disabled={exportingCountries}
                            >
                                Export
                            </ConfirmButton>
                        </>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalReportCountriesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
                />
            )}
            description={(
                <CountriesFilter
                    yearFilterHidden
                    onFilterChange={onFilterChange}
                />
            )}
        >
            {totalReportCountriesCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={reportCountries?.report?.countriesReport?.results}
                        keySelector={keySelector}
                        columns={reportCountryColumns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {loading && <Loading absolute />}
            {!reportCountriesLoading && totalReportCountriesCount <= 0 && (
                <Message
                    message="No countries found."
                />
            )}
        </Container>
    );
}

export default ReportCountryTable;
