import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Button,
    Modal,
    Numeral,
    NumeralProps,
} from '@togglecorp/toggle-ui';

import StringCell from '#components/tableHelpers/StringCell';
import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import CrisisForm from '#components/CrisisForm';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DateCell from '#components/tableHelpers/Date';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';

import {
    CrisesQuery,
    CrisesQueryVariables,
    DeleteCrisisMutation,
    DeleteCrisisMutationVariables,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

interface Entity {
    id: string;
    name?: string | undefined;
}

type CrisisFields = NonNullable<NonNullable<CrisesQuery['crisisList']>['results']>[number];

const CRISIS_LIST = gql`
    query Crises($ordering: String, $page: Int, $pageSize: Int, $name: String) {
        crisisList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name) {
            totalCount
            pageSize
            page
            results {
                name
                id
                crisisType
                crisisNarrative
                createdAt
                events {
                    totalCount
                }
                countries {
                    id
                    name
                }
                startDate
                endDate
                totalStockFigures
                totalFlowFigures
            }
        }
    }
`;

const CRISIS_DELETE = gql`
    mutation DeleteCrisis($id: ID!) {
        deleteCrisis(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: CrisisFields) => item.id;

interface CrisesProps {
    className?: string;
}

function Crises(props: CrisesProps) {
    const { className } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);
    const { notify } = useContext(NotificationContext);

    const [
        shouldShowAddCrisisModal,
        editableCrisisId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

    const crisesVariables = useMemo(
        (): CrisesQueryVariables => ({
            ordering,
            page,
            pageSize,
            name: search,
        }),
        [ordering, page, pageSize, search],
    );

    const {
        previousData,
        data: crisesData = previousData,
        loading: loadingCrises,
        refetch: refetchCrises,
    } = useQuery<CrisesQuery, CrisesQueryVariables>(CRISIS_LIST, {
        variables: crisesVariables,
    });

    const [
        deleteCrisis,
        { loading: deletingCrisis },
    ] = useMutation<DeleteCrisisMutation, DeleteCrisisMutationVariables>(
        CRISIS_DELETE,
        {
            onCompleted: (response) => {
                const { deleteCrisis: deleteCrisisRes } = response;
                if (!deleteCrisisRes) {
                    return;
                }
                const { errors, result } = deleteCrisisRes;
                if (errors) {
                    notify({ children: 'Sorry, Crisis could not be deleted!' });
                }
                if (result) {
                    refetchCrises(crisesVariables);
                    notify({ children: 'Crisis deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleCrisisCreate = React.useCallback(() => {
        refetchCrises(crisesVariables);
        hideAddCrisisModal();
    }, [refetchCrises, crisesVariables, hideAddCrisisModal]);

    const handleCrisisDelete = useCallback(
        (id: string) => {
            deleteCrisis({
                variables: { id },
            });
        },
        [deleteCrisis],
    );

    const { user } = useContext(DomainContext);
    const crisisPermissions = user?.permissions?.crisis;

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<CrisisFields, string>;
            type numberKeys = ExtractKeys<CrisisFields, number>;
            type entitiesKeys = ExtractKeys<CrisisFields, Array<Entity | null | undefined>>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: CrisisFields) => ({
                    value: datum[colName],
                }),
            });
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: CrisisFields) => ({
                    value: datum[colName],
                }),
            });
            const entitiesColumn = (colName: entitiesKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: CrisisFields) => ({
                    value: datum[colName]?.map((item) => item.name).join(', '),
                }),
            });
            const numberColumn = (colName: numberKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_: string, datum: CrisisFields) => ({
                    value: datum[colName],
                    placeholder: 'n/a',
                }),
            });

            // Specific columns
            const nameColumn: TableColumn<CrisisFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'name',
                title: 'Name',
                cellAsHeader: true,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'name'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.name,
                    route: route.crisis,
                    attrs: { crisisId: datum.id },
                }),
            };

            // eslint-disable-next-line max-len
            const eventCountColumn: TableColumn<CrisisFields, string, NumeralProps, TableHeaderCellProps> = {
                id: 'eventCount',
                title: 'Events',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_, datum) => ({
                    value: datum.events?.totalCount,
                }),
            };

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<CrisisFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: crisisPermissions?.delete ? handleCrisisDelete : undefined,
                    onEdit: crisisPermissions?.change ? showAddCrisisModal : undefined,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                nameColumn,
                createColumn(stringColumn, 'crisisType', 'Type'),
                createColumn(stringColumn, 'crisisNarrative', 'Narrative'),
                createColumn(entitiesColumn, 'countries', 'Country'),
                createColumn(dateColumn, 'startDate', 'Start Date'),
                createColumn(dateColumn, 'endDate', 'End Date'),
                eventCountColumn,
                createColumn(numberColumn, 'totalStockFigures', 'Stock'),
                createColumn(numberColumn, 'totalFlowFigures', 'Flow'),
                actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
            handleCrisisDelete,
            showAddCrisisModal,
            crisisPermissions?.delete,
            crisisPermissions?.change,
        ],
    );

    const totalCrisesCount = crisesData?.crisisList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.crises, className)}>
            <PageHeader
                title="Crises"
            />
            <Container
                heading="Crises"
                className={styles.container}
                contentClassName={styles.content}
                headerActions={(
                    <>
                        <TextInput
                            icons={<IoIosSearch />}
                            name="search"
                            value={search}
                            placeholder="Search"
                            onChange={setSearch}
                        />
                        {crisisPermissions?.add && (
                            <Button
                                name={undefined}
                                onClick={showAddCrisisModal}
                                disabled={loadingCrises}
                            >
                                Add Crisis
                            </Button>
                        )}
                    </>
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={totalCrisesCount}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
            >
                {totalCrisesCount > 0 && (
                    <Table
                        className={styles.table}
                        data={crisesData?.crisisList?.results}
                        keySelector={keySelector}
                        columns={columns}
                    />
                )}
                {(loadingCrises || deletingCrisis) && <Loading absolute />}
                {!loadingCrises && totalCrisesCount <= 0 && (
                    <Message
                        message="No crises found."
                    />
                )}
                {shouldShowAddCrisisModal && (
                    <Modal
                        onClose={hideAddCrisisModal}
                        heading={editableCrisisId ? 'Edit Crisis' : 'Add Crisis'}
                    >
                        <CrisisForm
                            id={editableCrisisId}
                            onCrisisCreate={handleCrisisCreate}
                            onCrisisFormCancel={hideAddCrisisModal}
                        />
                    </Modal>
                )}
            </Container>
        </div>
    );
}

export default Crises;
