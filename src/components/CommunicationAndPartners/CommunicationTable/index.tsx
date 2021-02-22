import React, { useCallback, useContext, useMemo, useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
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
    TableSortDirection,
    Pager,
    Button,
    useSortState,
    Modal,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined } from '@togglecorp/fujs';

import StringCell from '#components/tableHelpers/StringCell';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DateCell from '#components/tableHelpers/Date';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import { CountryOption } from '#components/CountrySelectInput';

import useModalState from '#hooks/useModalState';

import { ExtractKeys } from '#types';
import {
    CommunicationListQuery,
    CommunicationListQueryVariables,
    DeleteCommunicationMutation,
    DeleteCommunicationMutationVariables,
} from '#generated/types';

import CommunicationForm from './CommunicationForm';
import styles from './styles.css';

const GET_COMMUNICATIONS_LIST = gql`
    query CommunicationList($ordering: String, $page: Int, $pageSize: Int, $contact: ID, $subject: String, $country: ID) {
        communicationList(ordering: $ordering, page: $page, pageSize: $pageSize, contact: $contact, subjectContains: $subject, country: $country) {
            results {
                id
                content
                date
                subject
                contact {
                    id
                }
                country {
                    id
                    name
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
            errors
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
    className?: string;
    contact: string;
    defaultCountry: CountryOption | undefined | null;
}

function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        contact,
        defaultCountry,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validCommunicationSortState = sortState || communicationDefaultSortState;
    const communicationOrdering = validCommunicationSortState.direction === TableSortDirection.asc
        ? validCommunicationSortState.name
        : `-${validCommunicationSortState.name}`;
    const [communicationPage, setCommunicationPage] = useState(1);
    const [communicationPageSize, setCommunicationPageSize] = useState(10);
    const [communicationSearch, setCommunicationSearch] = useState<string | undefined>();

    const { notify } = useContext(NotificationContext);

    const [
        shouldShowAddCommunicationModal,
        editableCommunicationId,
        showAddCommunicationModal,
        hideAddCommunicationModal,
    ] = useModalState();

    const communicationsVariables = useMemo(
        (): CommunicationListQueryVariables => ({
            ordering: communicationOrdering,
            page: communicationPage,
            pageSize: communicationPageSize,
            subject: communicationSearch,
            contact,
            country: defaultCountry?.id,
        }),
        [
            communicationOrdering,
            communicationPage,
            communicationPageSize,
            communicationSearch,
            contact,
            defaultCountry?.id,
        ],
    );

    const {
        data: communications,
        loading: communicationsLoading,
        refetch: refetchCommunications,
    } = useQuery<CommunicationListQuery>(GET_COMMUNICATIONS_LIST, {
        variables: communicationsVariables,
    });

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
                const { errors, result } = deleteCommunicationRes;
                if (errors) {
                    notify({ children: 'Sorry, communication could not be deleted!' });
                }
                if (result) {
                    notify({ children: 'Communication deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
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

    const { user } = useContext(DomainContext);
    const commPermissions = user?.permissions?.communication;

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
                cellRenderer: StringCell,
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
                cellRenderer: StringCell,
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
                    onDelete: commPermissions?.delete ? handleCommunicationDelete : undefined,
                    onEdit: commPermissions?.change ? showAddCommunicationModal : undefined,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(dateColumn, 'date', 'Date of Communication'),
                createColumn(stringColumn, 'subject', 'Subject'),
                createColumn(entityColumn, 'medium', 'Medium'),
                defaultCountry ? undefined : createColumn(entityColumn, 'country', 'Country'),
                actionColumn,
            ].filter(isDefined);
        },
        [
            defaultCountry,
            setSortState,
            validCommunicationSortState,
            handleCommunicationDelete,
            showAddCommunicationModal,
            commPermissions?.delete,
            commPermissions?.change,
        ],
    );

    const communicationsList = communications?.communicationList?.results;
    const totalCommunicationsCount = communications?.communicationList?.totalCount ?? 0;
    const loadingCommunications = deleteCommunicationLoading || communicationsLoading;

    return (
        <Container
            heading="Communication"
            className={_cs(className, styles.container)}
            contentClassName={styles.content}
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={communicationSearch}
                        placeholder="Search"
                        onChange={setCommunicationSearch}
                    />
                    {commPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddCommunicationModal}
                        >
                            Add Communication
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={communicationPage}
                    itemsCount={totalCommunicationsCount}
                    maxItemsPerPage={communicationPageSize}
                    onActivePageChange={setCommunicationPage}
                    onItemsPerPageChange={setCommunicationPageSize}
                />
            )}
        >
            {totalCommunicationsCount > 0 && (
                <Table
                    className={styles.table}
                    data={communicationsList}
                    keySelector={keySelector}
                    columns={communicationColumns}
                />
            )}
            {loadingCommunications && <Loading absolute />}
            {!loadingCommunications && totalCommunicationsCount <= 0 && (
                <Message
                    message="No communications found."
                />
            )}
            {shouldShowAddCommunicationModal && (
                <Modal
                    onClose={hideAddCommunicationModal}
                    heading={editableCommunicationId ? 'Edit Communication' : 'Add Communication'}
                >
                    <CommunicationForm
                        contact={contact}
                        id={editableCommunicationId}
                        onHideAddCommunicationModal={hideAddCommunicationModal}
                        onAddCommunicationCache={handleRefetch}
                        defaultCountry={defaultCountry}
                    />
                </Modal>
            )}
        </Container>

    );
}

export default CommunicationTable;
