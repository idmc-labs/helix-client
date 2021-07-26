import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    createDateColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import {
    EntriesFigureQuery,
    EntriesFigureQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const ENTRIES_FIGURE = gql`
    query EntriesFigure($entry: ID!) {
        entry(id: $entry) {
            id
            figures {
                id
                createdAt
                createdBy {
                    id
                    fullName
                }
                category {
                    id
                    name
                }
                country {
                    id
                    name
                }
                role
                totalFigures
                term {
                    id
                    name
                }
                endDate
                startDate
            }
        }
    }
`;

type FigureFields = NonNullable<NonNullable<EntriesFigureQuery['entry']>['figures']>[number];

const keySelector = (item: FigureFields) => item.id;

interface FigureProps {
    className?: string;
    entry: string;
    heading?: React.ReactNode;
}

function EntriesFigureTable(props: FigureProps) {
    const {
        className,
        entry,
        heading = 'Figures',
    } = props;

    const sortState = useSortState();

    const variables = useMemo(
        (): EntriesFigureQueryVariables => ({
            entry,
        }),
        [entry],
    );

    const {
        previousData,
        data: entryFigures = previousData,
        loading: entryFiguresLoading,
        // TODO: handle error
    } = useQuery<EntriesFigureQuery>(ENTRIES_FIGURE, { variables });

    const loading = entryFiguresLoading;
    const totalEntryFiguresCount = entryFigures?.entry?.figures.length ?? 0;

    const entryFigureColumns = useMemo(
        () => ([
            createDateColumn<FigureFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<FigureFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createTextColumn<FigureFields, string>(
                'country__name',
                'Country',
                (item) => item.country?.name,
                { sortable: true },
            ),
            createTextColumn<FigureFields, string>(
                'term__name',
                'Term',
                (item) => item.term?.name,
                { sortable: true },
            ),
            createTextColumn<FigureFields, string>(
                'role',
                'Role',
                (item) => item.role,
                { sortable: true },
            ),
            createTextColumn<FigureFields, string>(
                'category__name',
                'Figure Type',
                (item) => item.category?.name,
                { sortable: true },
            ),
            createNumberColumn<FigureFields, string>(
                'total_figures',
                'Total Figure',
                (item) => item.totalFigures,
                { sortable: true },
            ),
            createDateColumn<FigureFields, string>(
                'start_date',
                'Start Date',
                (item) => item.startDate,
                { sortable: true },
            ),
            createDateColumn<FigureFields, string>(
                'end_date',
                'End Date',
                (item) => item.endDate,
                { sortable: true },
            ),
        ]),
        [],
    );

    return (
        <Container
            heading={heading}
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            compact
        >
            {totalEntryFiguresCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={entryFigures?.entry?.figures}
                        keySelector={keySelector}
                        columns={entryFigureColumns}
                    />
                </SortContext.Provider>
            )}
            {loading && <Loading absolute />}
            {!entryFiguresLoading && totalEntryFiguresCount <= 0 && (
                <Message
                    message="No figures found."
                />
            )}
        </Container>
    );
}

export default EntriesFigureTable;
