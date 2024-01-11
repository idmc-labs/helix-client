import React, { useMemo, useCallback, useContext, useState } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { isDefined, listToMap } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    ConfirmButton,
    Pager,
    Checkbox,
    CheckboxProps,
    Button,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createStatusColumn,
    createDateColumn,
    createNumberColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Message from '#components/Message';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import SymbolCell, { SymbolCellProps } from '#components/tableHelpers/SymbolCell';
import {
    ExtractionFigureListQuery,
    ExtractionFigureListQueryVariables,
    DeleteFigureMutation,
    DeleteFigureMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    ExportFiguresMutation,
    ExportFiguresMutationVariables,
} from '#generated/types';
import route from '#config/routes';
import useModalState from '#hooks/useModalState';

import UpdateFigureRoleModal from './UpdateFigureRoleModal';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);
const MAX_SELECT_COUNT = 100;

export const FIGURE_LIST = gql`
    query ExtractionFigureList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: FigureExtractionFilterDataInputType,
    ) {
        figureList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
            page
            pageSize
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
                geolocations
                sourcesReliability
                country {
                    id
                    idmcShortName
                }
                entry {
                    id
                    oldId
                    articleTitle
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
                includeIdu
                isHousingDestruction

                reviewStatus
                reviewStatusDisplay
            }
        }
    }
`;

const FIGURES_DOWNLOAD = gql`
    mutation ExportFigures(
        $filters: FigureExtractionFilterDataInputType!,
    ) {
       exportFigures(
            filters: $filters,
        ) {
           errors
            ok
        }
    }
`;

const FIGURE_DELETE = gql`
    mutation DeleteFigure($id: ID!) {
        deleteFigure(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type FigureFields = NonNullable<NonNullable<ExtractionFigureListQuery['figureList']>['results']>[number];

const keySelector = (item: FigureFields) => item.id;

interface NudeFigureTableProps {
    className?: string;
    filters?: ExtractionEntryListFiltersQueryVariables;
    hiddenColumns?: ('event' | 'crisis' | 'entry' | 'country' | 'createdBy')[];
    page: number;
    pageSize: number;
    onPageChange: (value: number) => void;
    onPageSizeChange: (value: number) => void;
    pagerPageControlDisabled?: boolean;
}

function useFigureTable(props: NudeFigureTableProps) {
    const {
        className,
        filters,
        hiddenColumns = [],
        page,
        pageSize,
        onPageChange,
        onPageSizeChange,
        pagerPageControlDisabled,
    } = props;

    // FIXME: clear selected figures when filters is applied
    const [selectedFigures, setSelectedFigures] = useState<string[]>([]);
    const [mode, setMode] = useState<'SELECT' | 'DESELECT'>('SELECT');

    const selectedFiguresMapping = useMemo(
        () => listToMap(
            selectedFigures,
            (d) => d,
            () => true,
        ), [selectedFigures],
    );

    const [
        roleUpdatedModal, ,
        showRoleUpdateModal,
        hideRoleUpdateModal,
    ] = useModalState();
    const {
        previousData,
        data: figuresData = previousData,
        loading: loadingFigures,
        refetch: refetchFigures,
    } = useQuery<ExtractionFigureListQuery, ExtractionFigureListQueryVariables>(FIGURE_LIST, {
        variables: filters,
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        deleteFigure,
        { loading: deletingFigure },
    ] = useMutation<DeleteFigureMutation, DeleteFigureMutationVariables>(
        FIGURE_DELETE,
        {
            onCompleted: (response) => {
                const { deleteFigure: deleteFigureRes } = response;
                if (!deleteFigureRes) {
                    return;
                }
                const { errors } = deleteFigureRes;
                if (errors) {
                    notifyGQLError(errors);
                } else {
                    refetchFigures(filters);
                    notify({
                        children: 'Figure deleted successfully!',
                        variant: 'success',
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

    const [
        exportFigures,
        { loading: exportingTableData },
    ] = useMutation<ExportFiguresMutation, ExportFiguresMutationVariables>(
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

    // TODO: hide all actions when at least one figure is selected

    const handleFigureDelete = useCallback(
        (id: string) => {
            deleteFigure({
                variables: { id },
            });
        },
        [deleteFigure],
    );

    const handleExportTableData = useCallback(
        () => {
            exportFigures({
                variables: {
                    filters: filters?.filters ?? {},
                },
            });
        },
        [exportFigures, filters],
    );

    const { user } = useContext(DomainContext);
    const entryPermissions = user?.permissions?.entry;

    const totalFiguresCount = figuresData?.figureList?.totalCount ?? 0;
    const selectedFiguresCount = useMemo(
        () => {
            if (mode === 'DESELECT') {
                return (figuresData?.figureList?.totalCount ?? 0) - selectedFigures.length;
            }
            return selectedFigures.length;
        }, [
            mode,
            figuresData?.figureList,
            selectedFigures,
        ],
    );

    const headerCheckboxValue = (
        selectedFiguresCount === totalFiguresCount
        && totalFiguresCount !== 0
    );
    const headerCheckboxIndeterminate = (
        selectedFiguresCount < totalFiguresCount
        && selectedFiguresCount > 0
    );

    const handleHeaderCheckboxClick = useCallback(() => {
        if (headerCheckboxValue) {
            setMode('SELECT');
        } else {
            setMode('DESELECT');
        }
        setSelectedFigures([]);
    }, [headerCheckboxValue]);

    const handleCheckboxClick = useCallback((_: boolean, figure: FigureFields) => {
        const { id } = figure;
        setSelectedFigures((oldSelectedFigures) => {
            const index = oldSelectedFigures.findIndex((fig) => fig === id);
            if (index === -1) {
                return [...oldSelectedFigures, id];
            }
            return oldSelectedFigures.filter((fig) => fig !== id);
        });
    }, []);

    const queryBasedFigureList = figuresData?.figureList?.results;

    const columns = useMemo(
        () => {
            const selectColumn: TableColumn<
                FigureFields,
                string,
                CheckboxProps<string>,
                CheckboxProps<string>
            > = {
                id: 'select',
                title: '',
                headerCellRenderer: Checkbox,
                headerCellRendererClassName: styles.checkbox,
                headerCellRendererParams: {
                    value: headerCheckboxValue,
                    onChange: handleHeaderCheckboxClick,
                    indeterminate: headerCheckboxIndeterminate,
                },
                cellRenderer: Checkbox,
                cellRendererParams: (_, data) => ({
                    name: data.id,
                    value: mode === 'SELECT'
                        ? selectedFiguresMapping[data.id]
                        : !selectedFiguresMapping[data.id],
                    onChange: (newVal) => handleCheckboxClick(newVal, data),
                }),
                cellRendererClassName: styles.checkbox,
                columnWidth: 48,
            };

            const symbolColumn: TableColumn<
                FigureFields,
                string,
                SymbolCellProps,
                TableHeaderCellProps
            > = {
                id: 'sources_reliability',
                title: 'Sources Reliability',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                cellRenderer: SymbolCell,
                cellRendererParams: (_, datum) => ({
                    sourcesData: datum?.sourcesReliability,
                }),
            };

            return [
                selectColumn,
                createDateColumn<FigureFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                hiddenColumns.includes('createdBy')
                    ? undefined
                    : createTextColumn<FigureFields, string>(
                        'created_by__full_name',
                        'Created by',
                        (item) => item.createdBy?.fullName,
                        { sortable: true },
                    ),
                hiddenColumns.includes('entry')
                    ? undefined
                    : createStatusColumn<FigureFields, string>(
                        'entry__article_title',
                        'Entry',
                        (item) => ({
                            title: item.entry.articleTitle,
                            attrs: { entryId: item.entry.id },
                            ext: item.entry.oldId
                                ? `/documents/${item.entry.oldId}`
                                : undefined,
                            hash: '/figures-and-analysis',
                            search: `id=${item.id}`,
                            status: item.reviewStatus,
                        }),
                        route.entryView,
                        { sortable: true },
                    ),
                createTextColumn<FigureFields, string>(
                    'geolocations',
                    'Location',
                    (item) => item.geolocations,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.event?.eventTypeDisplay,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'figure_typology',
                    'Figure Type',
                    (item) => item.figureTypology,
                ),
                hiddenColumns.includes('country')
                    ? undefined
                    : createTextColumn<FigureFields, string>(
                        'country__idmc_short_name',
                        'Country',
                        (item) => item.country?.idmcShortName,
                        { sortable: true },
                    ),
                createTextColumn<FigureFields, string>(
                    'term',
                    'Term',
                    (item) => item.termDisplay,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'role',
                    'Role',
                    (item) => item.roleDisplay,
                    { sortable: true },
                ),
                createLinkColumn<FigureFields, string>(
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
                symbolColumn,
                createNumberColumn<FigureFields, string>(
                    'total_figures',
                    'Total Figure',
                    (item) => item.totalFigures,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'flow_start_date',
                    'Start Date',
                    (item) => item.flowStartDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'flow_end_date',
                    'End Date',
                    (item) => item.flowEndDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'stock_date',
                    'Stock Date',
                    (item) => item.stockDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'stock_reporting_date',
                    'Stock Reporting Date',
                    (item) => item.stockReportingDate,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'include_idu',
                    'Excerpt IDU',
                    (item) => (item.includeIdu ? 'Yes' : 'No'),
                ),
                createTextColumn<FigureFields, string>(
                    'is_housing_destruction',
                    'Housing Destruction',
                    (item) => (item.isHousingDestruction ? 'Yes' : 'No'),
                ),
                hiddenColumns.includes('event')
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
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
                hiddenColumns.includes('crisis')
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
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
                createCustomActionColumn<FigureFields, string, ActionProps>(
                    ActionCell,
                    (_, datum) => ({
                        id: datum.id,
                        deleteTitle: 'figure',
                        onDelete: entryPermissions?.delete ? handleFigureDelete : undefined,
                        editLinkRoute: route.entryEdit,
                        editLinkAttrs: { entryId: datum.entry.id },
                        editHash: '/figures-and-analysis',
                        editSearch: `id=${datum.id}`,
                    }),
                    'action',
                    '',
                    undefined,
                    2,
                ),
            ].filter(isDefined);
        },
        [
            handleFigureDelete,
            hiddenColumns,
            entryPermissions?.delete,
            handleHeaderCheckboxClick,
            handleCheckboxClick,
            headerCheckboxIndeterminate,
            headerCheckboxValue,
            selectedFiguresMapping,
            mode,
        ],
    );

    return {
        exportButton: (
            <ConfirmButton
                confirmationHeader="Confirm Export"
                confirmationMessage="Are you sure you want to export this table data?"
                name={undefined}
                onConfirm={handleExportTableData}
                disabled={exportingTableData}
            >
                Export
            </ConfirmButton>
        ),
        updateRoleButton: selectedFiguresCount > 0 && (
            <div className={styles.updateRoleSection}>
                <div>
                    {`${selectedFiguresCount} figure(s) selected.`}
                </div>
                {selectedFiguresCount > MAX_SELECT_COUNT ? (
                    <div>
                        {`Only ${MAX_SELECT_COUNT} figures can be selected.`}
                    </div>
                ) : (
                    <Button
                        name={undefined}
                        variant="primary"
                        onClick={showRoleUpdateModal}
                    >
                        Update role
                    </Button>
                )}
            </div>
        ),
        pager: (
            <Pager
                activePage={page}
                itemsCount={totalFiguresCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={onPageChange}
                onItemsPerPageChange={onPageSizeChange}
                itemsPerPageControlHidden={pagerPageControlDisabled}
            />
        ),
        table: (
            <>
                {totalFiguresCount > 0 && (
                    <Table
                        className={className}
                        data={queryBasedFigureList}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                )}
                {(loadingFigures || deletingFigure) && <Loading absolute />}
                {!loadingFigures && totalFiguresCount <= 0 && (
                    <Message
                        message="No figures found."
                    />
                )}
                {roleUpdatedModal && (
                    <UpdateFigureRoleModal
                        mode={mode}
                        onChangeMode={setMode}
                        selectedFigures={selectedFigures}
                        totalFigureSelected={selectedFiguresCount}
                        onClose={hideRoleUpdateModal}
                        onChangeSelectedFigures={setSelectedFigures}
                    />
                )}
            </>
        ),
    };
}
export default useFigureTable;
