import React, { useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';

import { Pager } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import Container from '#components/Container';
import DateTimeCell from '#components/tableHelpers/DateTime';
import MarkdownCell from '#components/tableHelpers/Markdown';
import Row from '#components/Row';

import {
    ContextualHistoryQuery,
    ContextualHistoryQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_CONTEXTUAL_HISTORY = gql`
    query ContextualHistory($id: ID!, $page: Int, $pageSize: Int){
        country(id: $id) {
            contextualUpdates(ordering: "-createdAt", page: $page, pageSize: $pageSize) {
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
        data: contextualUpdates,
        // loading: contextualUpdatesLoading,
    } = useQuery<ContextualHistoryQuery>(GET_CONTEXTUAL_HISTORY, {
        variables,
    });

    const contextualUpdatesList = contextualUpdates?.country?.contextualUpdates?.results;
    const showContextualUpdatesList = contextualUpdatesList && contextualUpdatesList.length > 0;
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
            {showContextualUpdatesList && contextualUpdatesList?.map((context) => (
                <div key={context.id} className={styles.card}>
                    <Row>
                        Created At
                        <DateTimeCell value={context.createdAt} />
                    </Row>
                    <Row>
                        Published On
                        <DateTimeCell value={context.publishDate} />
                    </Row>
                    <Row>
                        {`Crisis Type  ${context.crisisType}`}
                    </Row>
                    <Row>
                        <MarkdownCell value={context.update} />
                    </Row>
                </div>
            ))}
        </Container>

    );
}

export default ContextualHistoryList;
