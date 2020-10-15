import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Table,
    createColumn,
    TableHeaderCell,
    TableCell,
    useSortState,
    TableSortDirection,
} from '@togglecorp/toggle-ui';
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

const CRISIS_LIST = gql`
      query CrisisList($ordering: String) {
        crisisList(ordering: $ordering) {
        totalCount
        pageSize
        page
        results {
          name
          id
          crisisType
          crisisNarrative
          createdAt
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
}

const defaultSortState = { name: 'name', direction: TableSortDirection.asc };

function Crises() {
    const { sortState, setSortState } = useSortState();

    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const {
        data,
        loading,
    } = useQuery<CrisisListResponseFields, CrisisListVariables>(CRISIS_LIST, {
        variables: {
            ordering,
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

            const linkColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellAsHeader: true,
                cellRenderer: LinkCell,
                cellRendererParams: (_: string, datum: Crisis) => ({
                    title: datum[colName],
                    link: `/crises/${datum.id}/`,
                }),
            });

            return [
                createColumn(linkColumn, 'name', 'Name', true),
                createColumn(stringColumn, 'crisisType', 'Type'),
                createColumn(stringColumn, 'crisisNarrative', 'Narrative'),
                createColumn(dateColumn, 'createdAt', 'Date Created'),
            ];
        },
        [setSortState, validSortState],
    );
    const keySelector = (item: Crisis) => item.id;

    return (
        <div className={styles.crises}>
            <Table
                data={data?.crisisList.results}
                keySelector={keySelector}
                columns={columns}
            />
            {loading
                ? 'Loading...'
                : `Showing ${data?.crisisList.results?.length ?? 0} of ${data?.crisisList.totalCount}`}
        </div>
    );
}

export default Crises;
