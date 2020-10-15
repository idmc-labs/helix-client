import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    TextInput,
    Table,
    createColumn,
    TableHeaderCell,
    TableCell,
    useSortState,
    TableSortDirection,
    Pager,
    Numeral,
} from '@togglecorp/toggle-ui';
import { ExtractKeys } from '#types';

import Container from '#components/Container';

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

function Crises() {
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

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<Crisis, string>;

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

            const nameColumn = {
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
                cellRendererParams: (_: string, datum: Crisis) => ({
                    title: datum.name,
                    link: `/crises/${datum.id}/`,
                }),
            };
            const countColumn = {
                id: 'countryCount',
                title: 'Countries',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_: string, datum: Crisis) => ({
                    value: datum.countries.totalCount,
                }),
            };

            return [
                nameColumn,
                createColumn(stringColumn, 'crisisType', 'Type'),
                createColumn(stringColumn, 'crisisNarrative', 'Narrative'),
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                countColumn,
            ];
        },
        [setSortState, validSortState],
    );
    const keySelector = (item: Crisis) => item.id;

    return (
        <Container className={styles.crises}>
            <TextInput
                label="Search"
                name="search"
                value={search}
                onChange={setSearch}
            />
            <Table
                data={data?.crisisList.results}
                keySelector={keySelector}
                columns={columns}
            />
            <Pager
                activePage={page}
                itemsCount={data?.crisisList.totalCount ?? 0}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                onItemsPerPageChange={setPageSize}
            />
            {loading && 'Loading...'}
        </Container>
    );
}

export default Crises;
