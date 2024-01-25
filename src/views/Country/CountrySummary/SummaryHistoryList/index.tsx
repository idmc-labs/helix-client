import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager } from '@togglecorp/toggle-ui';

import DateTime from '#components/DateTime';
import useFilterState from '#hooks/useFilterState';
import Container from '#components/Container';
import Message from '#components/Message';
import { MarkdownPreview } from '#components/MarkdownEditor';

import {
    SummaryHistoryQuery,
    SummaryHistoryQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_SUMMARY_HISTORY = gql`
    query SummaryHistory($country: ID!, $page: Int, $pageSize: Int) {
        country(id: $country) {
            id
            summaries(ordering: "-created_at", page: $page, pageSize: $pageSize) {
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
    className?: string;
    country: string;
}

function SummaryHistoryList(props: SummaryHistoryProps) {
    const {
        className,
        country,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState({
        filter: {},
    });

    const variables = useMemo(
        (): SummaryHistoryQueryVariables => ({
            page,
            pageSize,
            country,
        }),
        [
            page,
            pageSize,
            country,
        ],
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
                    activePage={rawPage}
                    itemsCount={summeriesHistory?.country?.summaries?.totalCount ?? 0}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
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
