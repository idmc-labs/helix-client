import React, { useMemo, useCallback, useContext } from 'react';
import {
    useQuery,
    useMutation,
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
    createDateColumn,
    SortContext,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createStatusColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    ExtractionFigureListQuery,
    ExtractionFigureListQueryVariables,
    DeleteFigureMutation,
    DeleteFigureMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    // ExtractionEntryListFiltersQuery,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';
// import ExtractionFigureTable from '../ExtractionFigureTable';
import { FIGURE_LIST, FIGURE_DELETE } from '../../queries';

type ExtractionFigureFields = NonNullable<NonNullable<ExtractionFigureListQuery['figureList']>['results']>[number];

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}
const figuresDefaultSorting: TableSortParameter = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: ExtractionFigureFields) => item.id;

interface FiguresPanelProps {
    heading?: React.ReactNode;
    headingActions?: React.ReactNode;
    className?: string;
    extractionQueryFilters?: ExtractionEntryListFiltersQueryVariables;
    page: number;
    onPageChange: React.Dispatch<React.SetStateAction<number>>;
    pageSize: number,
    onPageSizeChange: React.Dispatch<React.SetStateAction<number>>;
}

function FiguresPanel(props: FiguresPanelProps) {
    const {
        heading = 'Figures',
        headingActions,
        className,
        extractionQueryFilters,
        page,
        onPageChange,
        pageSize,
        onPageSizeChange,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting ?? figuresDefaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const variables = useMemo(() => ({
        ...extractionQueryFilters,
        page,
        pageSize,
        ordering,
    }), [extractionQueryFilters, ordering, page, pageSize]);

    const {
        previousData,
        data: extractionFigureList = previousData,
        loading: extractionFigureListLoading,
        refetch: refetchEntries,
    } = useQuery<ExtractionFigureListQuery, ExtractionFigureListQueryVariables>(FIGURE_LIST, {
        variables,
    });

    const queryBasedFigureList = extractionFigureList?.figureList?.results;
    const totalFiguresCount = extractionFigureList?.figureList?.totalCount ?? 0;
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
                const { errors, result } = deleteFigureRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchEntries(variables);
                    notify({ children: 'Figure deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
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

    const { user } = useContext(DomainContext);

    const figurePermissions = user?.permissions?.entry;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ExtractionFigureFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: figurePermissions?.delete ? handleFigureDelete : undefined,
                    // editLinkRoute: route.entryEdit,
                    // editLinkAttrs: { entryId: datum.id },
                }),
            };

            return [
                createDateColumn<ExtractionFigureFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<ExtractionFigureFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                createLinkColumn<ExtractionFigureFields, string>(
                    'event__crisis__name',
                    'Crisis',
                    (item) => ({
                        title: item.entry.event.crisis?.name,
                        attrs: { crisisId: item.entry.event?.crisis?.id },
                    }),
                    route.crisis,
                    { sortable: true },
                ),
                createLinkColumn<ExtractionFigureFields, string>(
                    'event__name',
                    'Event',
                    (item) => ({
                        title: item.entry.event?.name,
                        // FIXME: this may be wrong
                        attrs: { eventId: item.entry.event?.id },
                    }),
                    route.event,
                    { sortable: true },
                ),
                createLinkColumn<ExtractionFigureFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.entry.articleTitle,
                        attrs: { entryId: item.id },
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                createDateColumn<ExtractionFigureFields, string>(
                    'publish_date',
                    'Publish Date',
                    (item) => item.entry.publishDate,
                    { sortable: true },
                ),
                createTextColumn<ExtractionFigureFields, string>(
                    'publishers',
                    'Publishers',
                    (item) => item.entry.publishers?.results?.map((p) => p.name).join(', '),
                ),
                createTextColumn<ExtractionFigureFields, string>(
                    'sources',
                    'Sources',
                    (item) => item.entry.sources?.results?.map((s) => s.name).join(', '),
                ),
                createTextColumn<ExtractionFigureFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.entry.event.eventType,
                    { sortable: true },
                ),
                createNumberColumn<ExtractionFigureFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
                    (item) => item.entry.totalFlowNdFigures,
                    // { sortable: true },
                ),
                createNumberColumn<ExtractionFigureFields, string>(
                    'total_stock_idp_figures',
                    'No. of IDPs',
                    (item) => item.entry.totalStockIdpFigures,
                    // { sortable: true },
                ),
                createStatusColumn<ExtractionFigureFields, string>(
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
        [
            handleFigureDelete,
            // handleRowExpand,
            // expandedRow,
            figurePermissions?.delete,
        ],
    );

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.figuresTable)}
            contentClassName={styles.content}
            headerActions={headingActions}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalFiguresCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={onPageChange}
                    onItemsPerPageChange={onPageSizeChange}
                />
            )}
        >
            {totalFiguresCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={queryBasedFigureList}
                        keySelector={keySelector}
                        columns={columns}
                    />
                </SortContext.Provider>
            )}
            {(extractionFigureListLoading || deletingFigure) && <Loading absolute />}
            {!extractionFigureListLoading && totalFiguresCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </Container>
    );
}
export default FiguresPanel;
