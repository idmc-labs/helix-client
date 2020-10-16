import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoIosSearch,
    IoMdTrash,
    IoMdCreate,
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
    Numeral,
    NumeralProps,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';
import { ExtractKeys } from '#types';

import styles from './styles.css';

interface DateProps {
    value: string | undefined;
    className?: string;
}

function DateCell(props: DateProps) {
    const { value, className } = props;
    if (!value) {
        return null;
    }
    const date = new Date(value);
    const dateString = new Intl.DateTimeFormat('default').format(date);
    return (
        <time
            dateTime={value}
            className={className}
        >
            {dateString}
        </time>
    );
}

interface LinkProps {
    title?: string;
    link?: string;
    className?: string;
}
function LinkCell(props: LinkProps) {
    const {
        title,
        link,
        className,
    } = props;
    if (!link) {
        return null;
    }
    return (
        <Link
            className={className}
            to={link}
        >
            {title}
        </Link>
    );
}

interface ActionProps {
    id: string;
    className?: string;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
}
function ActionCell(props: ActionProps) {
    const {
        className,
        id,
        onDelete,
        onEdit,
    } = props;
    const handleDelete = useCallback(
        () => {
            onDelete(id);
        },
        [onDelete, id],
    );
    const handleEdit = useCallback(
        () => {
            onEdit(id);
        },
        [onEdit, id],
    );
    return (
        <div className={_cs(className, styles.actions)}>
            <QuickActionButton
                name={undefined}
                onClick={handleEdit}
                title="Edit crisis"
            >
                <IoMdCreate />
            </QuickActionButton>
            <QuickActionButton
                name={undefined}
                onClick={handleDelete}
                title="Delete crisis"
                variant="danger"
            >
                <IoMdTrash />
            </QuickActionButton>
        </div>
    );
}

const CRISIS_LIST = gql`
query CrisisList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
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
            countries {
                totalCount
            }
        }
    }
}
`;

interface Crisis {
    id: string;
    name: string;
    crisisType: 'DISASTER' | 'CONFLICT';
    crisisNarrative?: string;
    createdAt: string;
    countries: {
        totalCount: number;
    };
}

interface CrisisListResponseFields {
    crisisList: {
        results?: Crisis[];
        totalCount: number;
        page: number;
        pageSize: number;
    };
}
interface CrisisListVariables {
    ordering: string;
    page: number;
    pageSize: number;
    name: string | undefined;
}

const defaultSortState = { name: 'name', direction: TableSortDirection.asc };

const keySelector = (item: Crisis) => item.id;

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
    const [search, setSearch] = useState<string | undefined>('');
    const [pageSize, setPageSize] = useState(25);

    const {
        data,
        loading,
    } = useQuery<CrisisListResponseFields, CrisisListVariables>(CRISIS_LIST, {
        variables: {
            ordering,
            page,
            pageSize,
            name: search,
        },
    });

    const handleDelete = useCallback(
        (id: string) => {
            console.debug('Delete', id);
        },
        [],
    );
    const handleEdit = useCallback(
        (id: string) => {
            console.debug('Delete', id);
        },
        [],
    );

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<Crisis, string>;

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
                cellRendererParams: (_: string, datum: Crisis) => ({
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
                cellAsHeader: true,
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: Crisis) => ({
                    value: datum[colName],
                }),
            });

            // Specific columns
            const nameColumn: TableColumn<Crisis, string, LinkProps, TableHeaderCellProps> = {
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
                    link: `/crises/${datum.id}/`,
                }),
            };
            const countColumn: TableColumn<Crisis, string, NumeralProps, TableHeaderCellProps> = {
                id: 'countryCount',
                title: 'Countries',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_, datum) => ({
                    value: datum.countries.totalCount,
                }),
            };

            const actionColumn: TableColumn<Crisis, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: handleDelete,
                    onEdit: handleEdit,
                }),
            };

            return [
                nameColumn,
                createColumn(stringColumn, 'crisisType', 'Type'),
                createColumn(stringColumn, 'crisisNarrative', 'Narrative'),
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                countColumn,
                actionColumn,
            ];
        },
        [setSortState, validSortState, handleDelete, handleEdit],
    );

    return (
        <div className={_cs(styles.crises, className)}>
            <Container
                heading="Crises"
                headerActions={(
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={search}
                        onChange={setSearch}
                    />
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={data?.crisisList.totalCount ?? 0}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
            >
                <Table
                    className={styles.table}
                    data={data?.crisisList.results}
                    keySelector={keySelector}
                    columns={columns}
                />
                {loading && 'Loading...'}
            </Container>
        </div>
    );
}

export default Crises;
