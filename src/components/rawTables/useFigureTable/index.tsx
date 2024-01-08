import React, { useMemo, useCallback, useContext, useState } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    isDefined, listToMap, unique,
} from '@togglecorp/fujs';
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
    BulkApiOperationInputType,
} from '#generated/types';
import route from '#config/routes';
import useModalState from '#hooks/useModalState';
import UpdateFigureRoleModal from './UpdateFigureRoleModal';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);
const ALL_SELECT_COUNT = 100;

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

// TODO: use integration with server
const FIGURES_ROLE_UPDATE = gql`
    mutation TriggerBulkOperation ($data: BulkApiOperationInputType!) {
        triggerBulkOperation(data: $data) {
            ok
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
    const [selectedFigures, setSelectedFigures] = useState<string[]>([]);
    const [excludeFigures, setExcludeFigures] = useState<string[]>([]);
    const [mode, setMode] = useState<'SELECT' | 'DESELECT'>('SELECT');
    const [role, setRole] = useState<string | undefined>();

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
        onCompleted: (figureResponse) => {
            // Note: prevent empty from pageSize and ordering filter
            if (isDefined(filters?.filters)) {
                setSelectedFigures([]);
            }

            // eslint-disable-next-line max-len
            const totalRequestedFigures = figureResponse.figureList?.page * figureResponse.figureList?.pageSize;

            if (mode === 'DESELECT' && totalRequestedFigures <= ALL_SELECT_COUNT) {
                const newFigures = figureResponse.figureList?.results;
                setSelectedFigures(
                    (oldFigures) => unique([...oldFigures, ...newFigures ?? []], (d) => d.id),
                );
            }
        },
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

    const figures = useMemo(() => figuresData?.figureList?.results?.map(
        (fig) => fig.id,
    ), [figuresData]);

    const handleSelectAll = useCallback((value: boolean) => {
        setSelectedFigures((oldFigures) => {
            if (value) {
                setMode('DESELECT');
                return unique([...oldFigures, ...figures ?? []], (d) => d);
            }
            const idMap = listToMap(figures ?? [], (d) => d, () => true);
            return oldFigures.filter((d) => !idMap[d]);
        });
    }, [figures]);

    const handleSelection = useCallback((value: boolean, figure: FigureFields) => {
        if (value) {
            setSelectedFigures((oldSelectedFigures) => ([...oldSelectedFigures, figure.id]));
        } else {
            setSelectedFigures((oldSelectedFigures) => (
                oldSelectedFigures.filter((v) => v !== figure.id)
            ));
            setExcludeFigures((oldSelectedFigures) => ([...oldSelectedFigures, figure.id]));
        }
    }, []);

    const indeterminate = (mode === 'DESELECT' && excludeFigures.length > 0)
        || (mode === 'SELECT' && selectedFigures.length > 0);

    const columns = useMemo(
        () => {
            const selectedFiguresMap = listToMap(selectedFigures, (d) => d, () => true);
            const selectAllCheckValue = figures?.some((d) => selectedFiguresMap[d]);

            const selectColumn: TableColumn<
                FigureFields,
                string,
                CheckboxProps<string>,
                CheckboxProps<string>
            > = {
                id: 'select',
                title: '',
                headerCellRenderer: Checkbox,
                headerCellRendererParams: {
                    value: selectAllCheckValue,
                    onChange: handleSelectAll,
                    indeterminate,
                },
                cellRenderer: Checkbox,
                cellRendererParams: (_, data) => ({
                    name: data.id,
                    value: selectedFigures.some((id) => id === data.id),
                    onChange: (newVal) => handleSelection(newVal, data),
                }),
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
            figures,
            handleSelectAll,
            handleSelection,
            selectedFigures,
            indeterminate,
        ],
    );

    const queryBasedFigureList = figuresData?.figureList?.results;
    const totalFiguresCount = figuresData?.figureList?.totalCount ?? 0;

    return {
        updateRoleButton: (
            <Button
                name="update role"
                onClick={showRoleUpdateModal}
            >
                Update role
            </Button>
        ),
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
                        onClose={hideRoleUpdateModal}
                        handleRoleChange={setRole}
                        role={role}
                    />
                )}
            </>
        ),
    };
}
export default useFigureTable;
