import React, { useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import { Pager, DateTime } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import Container from '#components/Container';
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
                }
            }
        }
    }
`;

interface ContextualHistoryProps {
    className? : string;
    country: string;
}

function ContextualHistoryList(props: ContextualHistoryProps) {
    const {
        className,
        country,
    } = props;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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
        // loading: contextualAnalysesLoading,
    } = useQuery<ContextualHistoryQuery>(GET_CONTEXTUAL_HISTORY, {
        variables,
    });

    const contextualAnalysesList = contextualAnalyses?.country?.contextualAnalyses?.results;
    const showContextualAnalysesList = contextualAnalysesList && contextualAnalysesList.length > 0;
    return (
        <Container
            heading="Contextual Analyses History"
            className={_cs(className, styles.container)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={contextualAnalyses?.country?.contextualAnalyses?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {showContextualAnalysesList && contextualAnalysesList?.map((context) => (
                <div
                    key={context.id}
                    className={styles.card}
                >
                    {context.crisisType && (
                        <Row>
                            {context.crisisType}
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
