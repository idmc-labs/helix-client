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
    TableCell,
    useSortState,
    TableSortDirection,
    Pager,
    Button,
    Modal,
    Numeral,
    NumeralProps,
} from '@togglecorp/toggle-ui';

import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import CrisisForm from '#components/CrisisForm';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DateCell from '#components/tableHelpers/Date';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';

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
            }
        }
    }
`;

const CRISIS_DELETE = gql`
    mutation DeleteCrisis($id: ID!) {
        deleteCrisis(id: $id) {
            errors {
                field
                messages
            }
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
    const [pageSize, setPageSize] = useState(25);

    const [shouldShowAddCrisisModal, showAddCrisisModal, hideAddCrisisModal] = useModalState();
    const [crisisIdToEdit, setCrisisIdToEdit] = useState<string | undefined>();

    const closeAddCrisisModal = useCallback(
        () => {
            hideAddCrisisModal();
            setCrisisIdToEdit(undefined);
        },
        [hideAddCrisisModal],
    );

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
        data: crisesData,
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
                const { errors } = deleteCrisisRes;
                if (!errors) {
                    refetchCrises(crisesVariables);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleCrisisCreate = React.useCallback(() => {
        refetchCrises(crisesVariables);
        closeAddCrisisModal();
    }, [refetchCrises, crisesVariables, closeAddCrisisModal]);

    const handleCrisisDelete = useCallback(
        (id: string) => {
            deleteCrisis({
                variables: { id },
            });
        },
        [deleteCrisis],
    );

    const handleCrisisEdit = useCallback(
        (id: string) => {
            showAddCrisisModal();
            setCrisisIdToEdit(id);
        },
        [showAddCrisisModal],
    );

    const { user } = useContext(DomainContext);
    const crisisPermissions = user?.permissions?.crisis;

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<CrisisFields, string>;
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
                cellRenderer: TableCell,
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
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: CrisisFields) => ({
                    value: datum[colName]?.map((item) => item.name).join(', '),
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
                    onEdit: crisisPermissions?.change ? handleCrisisEdit : undefined,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                nameColumn,
                createColumn(stringColumn, 'crisisType', 'Type'),
                createColumn(stringColumn, 'crisisNarrative', 'Narrative'),
                createColumn(entitiesColumn, 'countries', 'Country'),
                eventCountColumn,
                actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
            handleCrisisDelete,
            handleCrisisEdit,
            crisisPermissions?.delete,
            crisisPermissions?.change,
        ],
    );

    return (
        <div className={_cs(styles.crises, className)}>
            <PageHeader
                title="Crises"
            />
            <Container
                heading="Crises"
                className={styles.container}
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
                        itemsCount={crisesData?.crisisList?.totalCount ?? 0}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
            >
                <Table
                    className={styles.table}
                    data={crisesData?.crisisList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
                {(loadingCrises || deletingCrisis) && <Loading />}
                {shouldShowAddCrisisModal && (
                    <Modal
                        onClose={closeAddCrisisModal}
                        heading={crisisIdToEdit ? 'Edit Crisis' : 'Add Crisis'}
                    >
                        <CrisisForm
                            id={crisisIdToEdit}
                            onCrisisCreate={handleCrisisCreate}
                            onCrisisFormCancel={closeAddCrisisModal}
                        />
                    </Modal>
                )}
            </Container>
        </div>
    );
}

export default Crises;
