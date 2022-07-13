import React, { useMemo, useState, useCallback } from 'react';
import { gql, useQuery } from '@apollo/client';

import { Pager, DateTime } from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import Message from '#components/Message';
import { MarkdownPreview } from '#components/MarkdownEditor';
import Row from '#components/Row';

import {
    ContextualHistoryQuery,
    ContextualHistoryQueryVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';

import styles from './styles.css';

const GET_CONTEXTUAL_HISTORY = gql`
    query ContextualHistory($id: ID!, $page: Int, $pageSize: Int) {
        country(id: $id) {
            id
            contextualAnalyses(ordering: "-createdAt", page: $page, pageSize: $pageSize) {
                page
                pageSize
                totalCount
                results {
                    id
                    createdAt
                    update
                    publishDate
                    crisisType
                    crisisTypeDisplay
                }
            }
        }
    }
`;

interface ContextualHistoryProps {
    className?: string;
    country: string;
}

function ContextualHistoryList(props: ContextualHistoryProps) {
    const {
        className,
        country,
    } = props;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const variables = useMemo(
        (): ContextualHistoryQueryVariables => ({
            page: debouncedPage,
            pageSize,
            id: country,
        }),
        [
            debouncedPage,
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
        data: contextualAnalyses,
        loading: contextualAnalysesLoading,
    } = useQuery<ContextualHistoryQuery>(GET_CONTEXTUAL_HISTORY, {
        variables,
    });

    const contextualAnalysesList = contextualAnalyses?.country?.contextualAnalyses?.results;
    const noElements = !contextualAnalysesList || contextualAnalysesList.length <= 0;

    return (
        <Container
            className={className}
            contentClassName={styles.container}
            borderless
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={
                        contextualAnalyses?.country?.contextualAnalyses?.totalCount ?? 0
                    }
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
                />
            )}
        >
            {!contextualAnalysesLoading && noElements && (
                <Message
                    message="No history found."
                />
            )}
            {contextualAnalysesList?.map((context) => (
                <div
                    key={context.id}
                    className={styles.card}
                >
                    {context.crisisType && (
                        <Row>
                            {context.crisisTypeDisplay}
                        </Row>
                    )}
                    {context.createdAt && (
                        <Row>
                            Created At
                            <DateTime value={context.createdAt} />
                        </Row>
                    )}
                    {context.publishDate && (
                        <Row>
                            Published On
                            <DateTime value={context.publishDate} />
                        </Row>
                    )}
                    {context.update && (
                        <Row>
                            <MarkdownPreview
                                markdown={context.update}
                            />
                        </Row>
                    )}
                </div>
            ))}
        </Container>
    );
}

export default ContextualHistoryList;
