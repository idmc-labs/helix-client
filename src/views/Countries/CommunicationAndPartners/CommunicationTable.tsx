import React, { useCallback, useMemo } from 'react';
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
    TableSortDirection,
    Pager,
    Button,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';

import {
    ExtractKeys,
} from '#types';

import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import {
    CommunicationListQuery,
} from '#generated/types';

import Loading from '#components/Loading';

import styles from './styles.css';

interface SortParameter{
    name: string;
    direction: TableSortDirection;
}

type CommunicationFields = NonNullable<NonNullable<CommunicationListQuery['communicationList']>['results']>[number];
const keySelector = (item: CommunicationFields) => item.id;

interface CommunicationListProps {
    className? : string;
    onShowAddCommunicationModal: () => void;
    onSetCommunicationIdOnEdit: (id: string) => void;
    onCommunicationDelete: (id: string) => void;
    communicationsList: CommunicationFields[] | undefined;
    page: number;
    pageSize: number;
    search: string | undefined;
    onSetPage: React.Dispatch<React.SetStateAction<number>>;
    onSetPageSize: React.Dispatch<React.SetStateAction<number>>;
    onSetCommunicationSearch: React.Dispatch<React.SetStateAction<string | undefined>>;
    totalCount: number | undefined;
    validSortState: SortParameter;
    onSetSortState: React.Dispatch<React.SetStateAction<SortParameter | undefined>>;
    loading: boolean;
}

function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        onShowAddCommunicationModal,
        onSetCommunicationIdOnEdit,
        onCommunicationDelete,
        communicationsList,
        page,
        pageSize,
        search,
        onSetPage,
        onSetPageSize,
        onSetCommunicationSearch,
        totalCount,
        validSortState,
        onSetSortState,
        loading,
    } = props;

    const handleSetCommunicationIdOnEdit = useCallback(
        (communicationId) => {
            onSetCommunicationIdOnEdit(communicationId);
            onShowAddCommunicationModal();
        }, [onSetCommunicationIdOnEdit, onShowAddCommunicationModal],
    );

    const communicationColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<CommunicationFields, string>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: onSetSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: CommunicationFields) => ({
                    value: datum[colName],
                }),
            });

            const mediumColumn = (colName: string) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: onSetSortState,
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
                createColumn(stringColumn, 'subject', 'Subject'),
                createColumn(stringColumn, 'title', 'Title'),
                createColumn(mediumColumn, 'medium', 'Medium'),
                actionColumn,
            ];
        }, [
            onSetSortState,
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
                        onChange={onSetCommunicationSearch}
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
                    itemsCount={totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={onSetPage}
                    onItemsPerPageChange={onSetPageSize}
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
