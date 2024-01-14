import React, { useMemo, useCallback, useContext, useState, useEffect } from 'react';
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

import Mounter from '#components/Mounter';
import TableMessage from '#components/TableMessage';
import {
    createLinkColumn,
    createTextColumn,
    createStatusColumn,
    createDateColumn,
    createNumberColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
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
import { hasNoData } from '#utils/common';

import UpdateFigureRoleModal from './UpdateFigureRoleModal';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);
const MAX_SELECT_COUNT = 100;

// NOTE: We are using CustomCheckbox because we cannot pass
// "name" property on the CellRenderer of the table
// Instead, we are passing nameKey
interface CustomCheckboxProps {
    value: boolean | undefined | null;
    onChange: (value: boolean | undefined, nameKey: string) => void;
    nameKey: string
}
function CustomCheckbox(props: CustomCheckboxProps) {
    const {
        nameKey,
        ...otherProps
    } = props;

    return (
        <Checkbox
            {...otherProps}
            name={nameKey}
        />
    );
}

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

interface Props {
    className?: string;
    filters?: ExtractionEntryListFiltersQueryVariables;
    hiddenColumns?: ('event' | 'crisis' | 'entry' | 'country' | 'createdBy')[];
    page: number;
    pageSize: number;
    onPageChange: (value: number) => void;
    onPageSizeChange: (value: number) => void;
    pagerPageControlDisabled?: boolean;
}

function useFigureTable(props: Props) {
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

    const [mounted, setMounted] = useState(false);

    const [selectedFigures, setSelectedFigures] = useState<string[]>([]);
    const [mode, setMode] = useState<'SELECT' | 'DESELECT'>('SELECT');

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
        error: figuresError,
    } = useQuery<ExtractionFigureListQuery, ExtractionFigureListQueryVariables>(FIGURE_LIST, {
        variables: filters,
        skip: !mounted,
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

    const figureFilters = filters?.filters;

    useEffect(
        () => {
            setSelectedFigures([]);
            setMode('SELECT');
        },
        [figureFilters],
    );

    const handleRoleUpdateSuccess = useCallback(
        () => {
            setSelectedFigures([]);
            setMode('SELECT');
        },
        [],
    );

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
                    filters: figureFilters ?? {},
                },
            });
        },
        [exportFigures, figureFilters],
    );

    const { user } = useContext(DomainContext);
    const entryPermissions = user?.permissions?.entry;

    const selectedFiguresMapping = useMemo(
        () => listToMap(
            selectedFigures,
            (d) => d,
            () => true,
        ),
        [selectedFigures],
    );

    const totalFiguresCount = figuresData?.figureList?.totalCount ?? 0;

    const selectedFiguresCount = mode === 'DESELECT'
        ? totalFiguresCount - selectedFigures.length
        : selectedFigures.length;

    const disableOtherActions = selectedFiguresCount > 0;

    const headerCheckboxValue = (
        selectedFiguresCount === totalFiguresCount && totalFiguresCount !== 0
    );
    const headerCheckboxIndeterminate = (
        selectedFiguresCount > 0 && selectedFiguresCount < totalFiguresCount
    );

    const handleHeaderCheckboxClick = useCallback(() => {
        if (headerCheckboxValue) {
            setMode('SELECT');
        } else {
            setMode('DESELECT');
        }
        setSelectedFigures([]);
    }, [headerCheckboxValue]);

    const handleCheckboxClick = useCallback((_: boolean | undefined, id: string) => {
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
                CustomCheckboxProps,
                CheckboxProps<string>
            > = {
                id: 'select',
                title: '',
                headerCellRenderer: Checkbox,
                headerCellRendererParams: {
                    value: headerCheckboxValue,
                    onChange: handleHeaderCheckboxClick,
                    indeterminate: headerCheckboxIndeterminate,
                },
                cellRenderer: CustomCheckbox,
                cellRendererParams: (_, data) => ({
                    nameKey: data.id,
                    value: mode === 'SELECT'
                        ? selectedFiguresMapping[data.id]
                        : !selectedFiguresMapping[data.id],
                    onChange: handleCheckboxClick,
                }),
                headerContainerClassName: styles.actionCellHeader,
                cellContainerClassName: styles.actionCell,
                headerCellRendererClassName: styles.checkbox,
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
                entryPermissions?.change
                    ? selectColumn
                    : undefined,
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
                        disabled: disableOtherActions,
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
            disableOtherActions,
        ],
    );

    return {
        exportButton: !disableOtherActions ? (
            <ConfirmButton
                confirmationHeader="Confirm Export"
                confirmationMessage="Are you sure you want to export this table data?"
                name={undefined}
                onConfirm={handleExportTableData}
                disabled={exportingTableData || selectedFigures.length > 0}
            >
                Export
            </ConfirmButton>
        ) : undefined,
        bulkActions: selectedFiguresCount > 0 && (
            <div className={styles.updateRoleSection}>
                <div>
                    <span>
                        {`${selectedFiguresCount} figure(s) selected.`}
                    </span>
                    {selectedFiguresCount > MAX_SELECT_COUNT && (
                        <span>
                            {` Only ${MAX_SELECT_COUNT} figures can updated at once.`}
                        </span>
                    )}
                </div>
                {selectedFiguresCount <= MAX_SELECT_COUNT && (
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
                <Mounter
                    onChange={setMounted}
                />
                {(loadingFigures || deletingFigure) && <Loading absolute />}
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
                {!loadingFigures && (
                    <TableMessage
                        errored={!!figuresError}
                        filtered={!hasNoData(filters?.filters)}
                        totalItems={totalFiguresCount}
                        emptyMessage="No figures found"
                        emptyMessageWithFilters="No figures found with applied filters"
                        errorMessage="Could not fetch figures"
                    />
                )}
                {roleUpdatedModal && (
                    <UpdateFigureRoleModal
                        mode={mode}
                        filters={figureFilters}
                        selectedFigures={selectedFigures}
                        totalSelectedFigures={selectedFiguresCount}
                        onClose={hideRoleUpdateModal}
                        onSuccess={handleRoleUpdateSuccess}
                    />
                )}
            </>
        ),
    };
}
export default useFigureTable;
