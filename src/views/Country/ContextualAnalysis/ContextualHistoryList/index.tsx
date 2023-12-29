import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager, DateTime } from '@togglecorp/toggle-ui';

import useFilterState from '#hooks/useFilterState';
import Container from '#components/Container';
import Message from '#components/Message';
import { MarkdownPreview } from '#components/MarkdownEditor';
import Row from '#components/Row';

import {
    ContextualHistoryQuery,
    ContextualHistoryQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_CONTEXTUAL_HISTORY = gql`
    query ContextualHistory($id: ID!, $page: Int, $pageSize: Int) {
        country(id: $id) {
            id
            contextualAnalyses(ordering: "-created_at", page: $page, pageSize: $pageSize) {
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
        (): ContextualHistoryQueryVariables => ({
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
                    activePage={rawPage}
                    itemsCount={
                        contextualAnalyses?.country?.contextualAnalyses?.totalCount ?? 0
                    }
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
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
