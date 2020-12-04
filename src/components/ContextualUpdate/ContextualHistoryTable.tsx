import React, { useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import {
    Table,
    createColumn,
    TableHeaderCell,
    TableSortDirection,
    Pager,
    useSortState,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import Container from '#components/Container';
import Loading from '#components/Loading';
import DateTimeCell from '#components/tableHelpers/DateTime';
import MarkdownCell from '#components/tableHelpers/Markdown';

import { ExtractKeys } from '#types';
import {
    ContextualHistoryQuery,
    ContextualHistoryQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_CONTEXTUAL_HISTORY = gql`
    query ContextualHistory($id: ID!, $ordering: String, $page: Int, $pageSize: Int){
        country(id: $id) {
            contextualUpdates(ordering: $ordering, page: $page, pageSize: $pageSize) {
                page
                pageSize
                totalCount
                results {
                    id
                    createdAt
                    update
                }
            }
        }
    }
`;

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

type ContextualUpdatesFields = NonNullable<NonNullable<NonNullable<ContextualHistoryQuery['country']>['contextualUpdates']>['results']>[number];

const keySelector = (item: ContextualUpdatesFields) => item.id;

interface ContextualHistoryProps {
    className? : string;
    country: string;
}

function ContextualHistoryTable(props: ContextualHistoryProps) {
    const {
        className,
        country,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;
    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): ContextualHistoryQueryVariables => ({
            ordering,
            page,
            pageSize,
            id: country,
        }),
        [
            ordering,
            page,
            pageSize,
            country,
        ],
    );

    const {
        data: contextualUpdates,
        loading: contextualUpdatesLoading,
    } = useQuery<ContextualHistoryQuery>(GET_CONTEXTUAL_HISTORY, {
        variables,
    });

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ContextualUpdatesFields, string>;

            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: DateTimeCell,
                cellRendererParams: (_: string, datum: ContextualUpdatesFields) => ({
                    value: datum[colName],
                }),
            });

            const markDownColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: false,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: MarkdownCell,
                cellRendererParams: (_: string, datum: ContextualUpdatesFields) => ({
                    value: datum[colName],
                }),
            });

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(markDownColumn, 'update', 'History'),
            ];
        },
        [
            setSortState,
            validSortState,
        ],
    );

    const loadingContextuals = contextualUpdatesLoading;

    return (
        <Container
            heading="Contextual Updates History"
            className={_cs(className, styles.container)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={contextualUpdates?.country?.contextualUpdates?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {loadingContextuals && <Loading />}
            <Table
                className={styles.table}
                data={contextualUpdates?.country?.contextualUpdates?.results}
                keySelector={keySelector}
                columns={columns}
            />
        </Container>

    );
}

export default ContextualHistoryTable;
