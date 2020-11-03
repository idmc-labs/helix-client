import React, { useCallback, useState, useMemo } from 'react';
import { gql, useQuery, useMutation, MutationUpdaterFn } from '@apollo/client';
import {
    _cs,
} from '@togglecorp/fujs';

import {
    IoIosSearch,
    IoMdPersonAdd,
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
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';

import {
    CommunicationEntity,
    ExtractKeys,
} from '#types';

import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import Loading from '#components/Loading';

import styles from './styles.css';

const GET_COMMUNICATIONS_LIST = gql`
query CommunicationList($ordering: String, $page: Int, $pageSize: Int, $subject: String, $contact: ID) {
    communicationList(ordering: $ordering, page: $page, pageSize: $pageSize, subjectContains: $subject, contact: $contact) {
      results {
        id
        content
        dateTime
        medium {
            id
            name
        }
        subject
        title
        contact {
          id
        }
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
            communication {
                id
            }
        }
    }
`;

interface CommunicationsResponseFields {
    communicationList: {
        results: CommunicationEntity[];
        totalCount: number;
        page: number;
        pageSize: number;
    }
}

interface DeleteCommunicationVariables {
    id: string | undefined,
}

interface DeleteCommunicationResponse {
    deleteCommunication:
    {
        ok: boolean,
        errors?: {
            field: string,
            message: string,
        }[],
        communication: {
            id: string,
        },
    }
}

type CacheCommunications = CommunicationsResponseFields | null | undefined;

const communicationDefaultSortState = {
    name: 'subject',
    direction: TableSortDirection.asc,
};

const keySelector = (item: CommunicationEntity) => item.id;

interface CommunicationListProps {
    className? : string;
    onShowAddCommunicationModal: () => void;
    contactIdForCommunication: string;
    onSetCommunicationIdOnEdit: (id: string) => void;
}
function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        onShowAddCommunicationModal,
        contactIdForCommunication,
        onSetCommunicationIdOnEdit,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || communicationDefaultSortState;

    const communicationOrdering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(25);

    const communicationsVariables = useMemo(
        () => ({
            ordering: communicationOrdering,
            page,
            pageSize,
            subject: search,
            contact: contactIdForCommunication,
        }),
        [communicationOrdering, page, pageSize, search, contactIdForCommunication],
    );

    const {
        data: communications,
        error: errorCommunications,
        loading: communicationsLoading,
    } = useQuery<CommunicationsResponseFields>(GET_COMMUNICATIONS_LIST, {
        variables: communicationsVariables,
    });
    const communicationsList = communications?.communicationList?.results;

    const handleDeleteCommunicationCache: MutationUpdaterFn<{
        deleteCommunication: { communication: { id: CommunicationEntity['id'] } }
    }> = useCallback((cache, data) => {
        if (!data) {
            return;
        }
        const id = data.data?.deleteCommunication.communication.id;
        const cacheCommunications: CacheCommunications = cache.readQuery({
            query: GET_COMMUNICATIONS_LIST,
            variables: communicationsVariables,
        });
        if (!cacheCommunications) {
            return;
        }
        const results = cacheCommunications?.communicationList.results;
        if (!results) {
            return;
        }
        const newResults = [...results].filter((res: { id: string; }) => res.id !== id);
        cache.writeQuery({
            query: GET_COMMUNICATIONS_LIST,
            data: {
                communicationList: {
                    __typename: 'CommunicationListType',
                    results: newResults,
                },
            },
        });
    }, [communicationsVariables]);

    const [
        deleteCommunication,
        { loading: deleteCommunicationLoading },
    ] = useMutation<DeleteCommunicationResponse, DeleteCommunicationVariables>(
        DELETE_COMMUNICATION,
        {
            update: handleDeleteCommunicationCache,
            onCompleted: (response: DeleteCommunicationResponse) => {
                if (!response.deleteCommunication.errors) {
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

    const handleSetCommunicationIdOnEdit = useCallback(
        (communicationId) => {
            onSetCommunicationIdOnEdit(communicationId);
            onShowAddCommunicationModal();
        }, [onSetCommunicationIdOnEdit, onShowAddCommunicationModal],
    );

    const loading = communicationsLoading || deleteCommunicationLoading;

    const communicationColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<CommunicationEntity, string>;

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
                cellAsHeader: true,
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: CommunicationEntity) => ({
                    value: datum[colName],
                }),
            });

            const mediumColumn = (colName: string) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: false,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: CommunicationEntity) => ({
                    value: datum.medium.name,
                }),
            });

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<CommunicationEntity, string, ActionProps, TableHeaderCellProps> = {
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
                createColumn(stringColumn, 'id', 'ID'),
                createColumn(stringColumn, 'subject', 'Subject'),
                createColumn(stringColumn, 'title', 'Title'),
                createColumn(mediumColumn, 'medium', 'Medium'),
                actionColumn,
            ];
        }, [
            setSortState,
            validSortState,
            handleCommunicationDelete,
            handleSetCommunicationIdOnEdit,
        ]);

    return (
        <Container
            heading="Communication"
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={search}
                        placeholder="Search"
                        onChange={setSearch}
                    />
                    <QuickActionButton
                        name="add"
                        onClick={onShowAddCommunicationModal}
                        className={styles.addButton}
                        transparent
                    >
                        <IoMdPersonAdd
                            className={styles.addIcon}
                        />
                        Add New Communication
                    </QuickActionButton>
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={communications?.communicationList?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {loading && <Loading />}
            <Table
                className={styles.table}
                data={communicationsList}
                keySelector={keySelector}
                columns={communicationColumns}
            />
        </Container>

    );
}

export default CommunicationTable;
