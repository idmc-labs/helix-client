import React, { useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import { Pager } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import Container from '#components/Container';
import DateTimeCell from '#components/tableHelpers/DateTime';
import MarkdownCell from '#components/tableHelpers/Markdown';

import {
    SummaryHistoryQuery,
    SummaryHistoryQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_SUMMARY_HISTORY = gql`
    query SummaryHistory($id: ID!, $page: Int, $pageSize: Int){
        country(id: $id) {
            summaries(ordering: "-createdAt", page: $page, pageSize: $pageSize) {
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
interface SummaryHistoryProps {
    className? : string;
    country: string;
}

function SummaryHistoryList(props: SummaryHistoryProps) {
    const {
        className,
        country,
    } = props;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): SummaryHistoryQueryVariables => ({
            page,
            pageSize,
            id: country,
        }),
        [
            page,
            pageSize,
            country,
        ],
    );

    const {
        data: summeriesHistory,
        // loading: summariesLoading,
    } = useQuery<SummaryHistoryQuery>(GET_SUMMARY_HISTORY, {
        variables,
    });

    const summeriesHistoryList = summeriesHistory?.country?.summaries?.results;
    const showContextualAnalysesList = summeriesHistoryList && summeriesHistoryList.length > 0;
    return (
        <Container
            heading="Summary History"
            className={_cs(className, styles.container)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={summeriesHistory?.country?.summaries?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {showContextualAnalysesList && summeriesHistoryList?.map((summart) => (
                <div key={summart.id} className={styles.card}>
                    <DateTimeCell value={summart.createdAt} />
                    <MarkdownCell value={summart.summary} />
                </div>
            ))}
        </Container>

    );
}

export default SummaryHistoryList;
