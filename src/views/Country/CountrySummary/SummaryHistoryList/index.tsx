import React, { useMemo, useState, useCallback } from 'react';
import { gql, useQuery } from '@apollo/client';

import { Pager, DateTime } from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import Message from '#components/Message';
import { MarkdownPreview } from '#components/MarkdownEditor';

import {
    SummaryHistoryQuery,
    SummaryHistoryQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_SUMMARY_HISTORY = gql`
    query SummaryHistory($id: ID!, $page: Int, $pageSize: Int) {
        country(id: $id) {
            id
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

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const {
        data: summeriesHistory,
        loading: summariesLoading,
    } = useQuery<SummaryHistoryQuery>(GET_SUMMARY_HISTORY, {
        variables,
    });

    const summariesHistoryList = summeriesHistory?.country?.summaries?.results;
    const noElements = !summariesHistoryList || summariesHistoryList.length <= 0;

    return (
        <Container
            className={className}
            contentClassName={styles.container}
            borderless
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={summeriesHistory?.country?.summaries?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
                />
            )}
        >
            {!summariesLoading && noElements && (
                <Message
                    message="No history found."
                />
            )}
            {summariesHistoryList?.map((summary) => (
                <div key={summary.id} className={styles.card}>
                    <DateTime
                        value={summary.createdAt}
                        format="datetime"
                    />
                    <MarkdownPreview
                        markdown={summary.summary}
                    />
                </div>
            ))}
        </Container>

    );
}

export default SummaryHistoryList;
