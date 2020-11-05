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
    Button,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';

import {
    ExtractKeys,
} from '#types';

import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import Loading from '#components/Loading';

import {
    CommunicationListQuery,
} from '#generated/types';

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

const communicationDefaultSortState = {
    name: 'subject',
    direction: TableSortDirection.asc,
};

interface CommunicationListProps {
    className? : string;
    onShowAddCommunicationModal: () => void;
    contactIdForCommunication: string;
    onSetCommunicationIdOnEdit: (id: string) => void;
    onCommunicationDelete: (id: string) => void;
}

type CommunicationFields = NonNullable<NonNullable<CommunicationListQuery['communicationList']>['results']>[number];
const keySelector = (item: CommunicationFields) => item.id;

function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        onShowAddCommunicationModal,
        contactIdForCommunication,
        onSetCommunicationIdOnEdit,
        onCommunicationDelete,
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
        // error: errorCommunications,
        loading: communicationsLoading,
    } = useQuery<CommunicationListQuery>(GET_COMMUNICATIONS_LIST, {
        variables: communicationsVariables,
    });
    const communicationsList = communications?.communicationList?.results;

    const handleSetCommunicationIdOnEdit = useCallback(
        (communicationId) => {
            onSetCommunicationIdOnEdit(communicationId);
            onShowAddCommunicationModal();
        }, [onSetCommunicationIdOnEdit, onShowAddCommunicationModal],
    );

    const loading = communicationsLoading;

    const communicationColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<CommunicationFields, string>;

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
                cellRendererParams: (_: string, datum: CommunicationFields) => ({
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
                cellRendererParams: (_: string, datum: CommunicationFields) => ({
                    value: datum.medium?.name,
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
                    onDelete: onCommunicationDelete,
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
            onCommunicationDelete,
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
                    <Button
                        name={undefined}
                        onClick={onShowAddCommunicationModal}
                        className={styles.addButton}
                        transparent
                        icons={<IoMdPersonAdd className={styles.addIcon} />}
                        label="Add New Communication"
                    >
                        Add New Communication
                    </Button>
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
