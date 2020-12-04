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
    SummaryHistoryQuery,
    SummaryHistoryQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_SUMMARY_HISTORY = gql`
    query SummaryHistory($id: ID!, $ordering: String, $page: Int, $pageSize: Int){
        country(id: $id) {
            summaries(ordering: $ordering, page: $page, pageSize: $pageSize) {
                page
                pageSize
                totalCount
                results {
                    id
                    createdAt
                    summary
                }
            }
        }
    }
`;

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

type SummaryFields = NonNullable<NonNullable<NonNullable<SummaryHistoryQuery['country']>['summaries']>['results']>[number];

const keySelector = (item: SummaryFields) => item.id;

interface SummaryHistoryProps {
    className? : string;
    country: string;
}

function SummaryHistoryTable(props: SummaryHistoryProps) {
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
        (): SummaryHistoryQueryVariables => ({
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
        data: contextual,
        loading: contextualLoading,
    } = useQuery<SummaryHistoryQuery>(GET_SUMMARY_HISTORY, {
        variables,
    });

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<SummaryFields, string>;

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
                cellRendererParams: (_: string, datum: SummaryFields) => ({
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
                cellRendererParams: (_: string, datum: SummaryFields) => ({
                    value: datum[colName],
                }),
            });

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(markDownColumn, 'summary', 'Summary'),
            ];
        },
        [
            setSortState,
            validSortState,
        ],
    );

    const loadingSummarys = contextualLoading;

    return (
        <Container
            heading="Summary  History"
            className={_cs(className, styles.container)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={contextual?.country?.summaries?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {loadingSummarys && <Loading />}
            <Table
                className={styles.table}
                data={contextual?.country?.summaries?.results}
                keySelector={keySelector}
                columns={columns}
            />
        </Container>

    );
}

export default SummaryHistoryTable;
