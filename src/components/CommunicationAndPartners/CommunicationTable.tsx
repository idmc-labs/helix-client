import React, { useCallback, useMemo, useState } from 'react';
import { gql, useQuery, useMutation, MutationUpdaterFn } from '@apollo/client';
import produce from 'immer';
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
    TableSortDirection,
    Pager,
    Button,
    useSortState,
    Modal,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DateCell, { DateProps } from '#components/tableHelpers/Date';
import useModalState from '#hooks/useModalState';

import { ExtractKeys } from '#types';
import {
    CommunicationListQuery,
    UpdateCommunicationMutation,
    DeleteCommunicationMutation,
    DeleteCommunicationMutationVariables,
} from '#generated/types';

import CommunicationForm from './CommunicationForm';
import styles from './styles.css';

const GET_COMMUNICATIONS_LIST = gql`
    query CommunicationList($ordering: String, $page: Int, $pageSize: Int, $contact: ID, $subject: String) {
        communicationList(ordering: $ordering, page: $page, pageSize: $pageSize, contact: $contact, subjectContains: $subject) {
            results {
                id
                content
                dateTime
                subject
                title
                contact {
                    id
                }
                medium {
                    id
                    name
                }
                createdAt
            }
            totalCount
            pageSize
            page
        }
    }
`;

const DELETE_COMMUNICATION = gql`
    mutation DeleteCommunication($id: ID!) {
        deleteCommunication(id: $id) {
            errors {
                field
                messages
            }
            ok
            result {
                id
            }
        }
    }
`;

const communicationDefaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

type CommunicationFields = NonNullable<NonNullable<CommunicationListQuery['communicationList']>['results']>[number];

interface Entity {
    id: string;
    name: string | undefined;
}

const keySelector = (item: CommunicationFields) => item.id;

interface CommunicationListProps {
    className? : string;
    contact: string;
}

function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        contact,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validCommunicationSortState = sortState || communicationDefaultSortState;
    const communicationOrdering = validCommunicationSortState.direction === TableSortDirection.asc
        ? validCommunicationSortState.name
        : `-${validCommunicationSortState.name}`;
    const [communicationPage, setCommunicationPage] = useState(1);
    const [communicationPageSize, setCommunicationPageSize] = useState(25);
    const [communicationSearch, setCommunicationSearch] = useState<string | undefined>();

    const [
        communicationIdOnEdit,
        setCommunicationIdOnEdit,
    ] = useState<CommunicationFields['id']>('');

    const [
        shouldShowAddCommunicationModal,
        showAddCommunicationModal,
        hideAddCommunicationModal,
    ] = useModalState();

    const communicationsVariables = useMemo(
        () => ({
            ordering: communicationOrdering,
            page: communicationPage,
            pageSize: communicationPageSize,
            subject: communicationSearch,
            contact,
        }),
        [
            communicationOrdering,
            communicationPage,
            communicationPageSize,
            communicationSearch,
            contact,
        ],
    );

    const {
        data: communications,
        // error: errorCommunications,
        loading: communicationsLoading,
        refetch: refetchCommunications,
    } = useQuery<CommunicationListQuery>(GET_COMMUNICATIONS_LIST, {
        variables: communicationsVariables,
    });

    const handleUpdateCommunicationCache: MutationUpdaterFn<
        UpdateCommunicationMutation
    > = useCallback(
        (cache, data) => {
            const communication = data?.data?.updateCommunication?.result;
            if (!communication) {
                return;
            }

            const cacheData = cache.readQuery<CommunicationListQuery>({
                query: GET_COMMUNICATIONS_LIST,
                variables: communicationsVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.communicationList?.results) {
                    return;
                }
                const { results } = safeCacheData.communicationList;
                const communicationIndex = results.findIndex((com) => com.id === communication.id);
                if (communicationIndex !== -1) {
                    results.splice(communicationIndex, 1);
                }
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: GET_COMMUNICATIONS_LIST,
                data: updatedValue,
            });
        },
        [communicationsVariables],
    );

    const handleRefetch = useCallback(
        () => {
            refetchCommunications(communicationsVariables);
        },
        [refetchCommunications, communicationsVariables],
    );

    const [
        deleteCommunication,
        { loading: deleteCommunicationLoading },
    ] = useMutation<DeleteCommunicationMutation, DeleteCommunicationMutationVariables>(
        DELETE_COMMUNICATION,
        {
            update: handleRefetch,
            onCompleted: (response) => {
                const { deleteCommunication: deleteCommunicationRes } = response;
                if (!deleteCommunicationRes) {
                    return;
                }
                const { errors } = deleteCommunicationRes;
                if (!errors) {
                    // TODO: handle what to do if not okay?
                }
            },
            // TODO: handle onError
        },
    );

    const handleCommunicationDelete = useCallback(
        (id) => {
            deleteCommunication({
                variables: { id },
            });
        },
        [deleteCommunication],
    );

    const handleHideAddCommunicationModal = useCallback(
        () => {
            setCommunicationIdOnEdit('');
            hideAddCommunicationModal();
        },
        [hideAddCommunicationModal, setCommunicationIdOnEdit],
    );

    const handleSetCommunicationIdOnEdit = useCallback(
        (communicationId) => {
            setCommunicationIdOnEdit(communicationId);
            showAddCommunicationModal();
        },
        [setCommunicationIdOnEdit, showAddCommunicationModal],
    );

    const communicationColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<CommunicationFields, string>;
            type entityKeys = ExtractKeys<CommunicationFields, Entity>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validCommunicationSortState.name
                        ? validCommunicationSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: CommunicationFields) => ({
                    value: datum[colName],
                }),
            });

            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validCommunicationSortState.name
                        ? validCommunicationSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: CommunicationFields) => ({
                    value: datum[colName],
                }),
            });

            const entityColumn = (colName: entityKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validCommunicationSortState.name
                        ? validCommunicationSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: CommunicationFields) => ({
                    value: datum[colName]?.name,
                }),
            });

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<CommunicationFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: handleCommunicationDelete,
                    onEdit: handleSetCommunicationIdOnEdit,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(dateColumn, 'dateTime', 'Date of Communication'),
                createColumn(stringColumn, 'subject', 'Subject'),
                createColumn(stringColumn, 'title', 'Title'),
                createColumn(entityColumn, 'medium', 'Medium'),
                actionColumn,
            ];
        },
        [
            setSortState,
            validCommunicationSortState,
            handleCommunicationDelete,
            handleSetCommunicationIdOnEdit,
        ],
    );

    const communicationsList = communications?.communicationList?.results;
    const communicationTotalCount = communications?.communicationList?.totalCount;
    const loadingCommunications = deleteCommunicationLoading || communicationsLoading;

    return (
        <Container
            heading="Communication"
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={communicationSearch}
                        placeholder="Search"
                        onChange={setCommunicationSearch}
                    />
                    <Button
                        name={undefined}
                        onClick={showAddCommunicationModal}
                        className={styles.addButton}
                        label="Add New Communication"
                    >
                        Add New Communication
                    </Button>
                </>
            )}
            footerContent={(
                <Pager
                    activePage={communicationPage}
                    itemsCount={communicationTotalCount ?? 0}
                    maxItemsPerPage={communicationPageSize}
                    onActivePageChange={setCommunicationPage}
                    onItemsPerPageChange={setCommunicationPageSize}
                />
            )}
        >
            {loadingCommunications && <Loading />}
            <Table
                className={styles.table}
                data={communicationsList}
                keySelector={keySelector}
                columns={communicationColumns}
            />
            {shouldShowAddCommunicationModal && (
                <Modal
                    onClose={handleHideAddCommunicationModal}
                    heading={communicationIdOnEdit ? 'Edit Communication' : 'Add New Communication'}
                >
                    <CommunicationForm
                        contact={contact}
                        id={communicationIdOnEdit}
                        onHideAddCommunicationModal={handleHideAddCommunicationModal}
                        onUpdateCommunicationCache={handleUpdateCommunicationCache}
                        onAddCommunicationCache={handleRefetch}
                    />
                </Modal>
            )}
        </Container>

    );
}

export default CommunicationTable;
