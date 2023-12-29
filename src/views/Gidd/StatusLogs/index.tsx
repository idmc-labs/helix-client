import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
    Pager,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import {
    StatusLogsQuery,
    StatusLogsQueryVariables,
} from '#generated/types';

import useFilterState from '#hooks/useFilterState';
import Loading from '#components/Loading';
import Container from '#components/Container';

import StatusLogItem from './StatusLogItem';
import styles from './styles.css';

export const STATUS_LOGS = gql`
    query StatusLogs($ordering: String, $page: Int, $pageSize: Int) {
        giddLogs(pageSize: $pageSize, page: $page, ordering: $ordering) {
            totalCount
            results {
                id
                completedAt
                status
                statusDisplay
                triggeredAt
                triggeredBy {
                    id
                    fullName
                }
            }
        }
    }
`;

interface StatusLogsProps {
    className?: string;
}

function StatusLogs(props: StatusLogsProps) {
    const { className } = props;

    const {
        page,
        rawPage,
        setPage,

        rawPageSize,
        pageSize,
    } = useFilterState({
        filter: {},
    });

    const statusLogVariables = useMemo(
        (): StatusLogsQueryVariables => ({
            ordering: '-triggered_at',
            page,
            pageSize,
        }),
        [page, pageSize],
    );

    const {
        data: statusLogData,
        loading: statusLogDataLoading,
    } = useQuery<StatusLogsQuery>(STATUS_LOGS, { variables: statusLogVariables });

    const statusLogs = statusLogData?.giddLogs?.results;
    const totalStatusLogsCount = statusLogData?.giddLogs?.totalCount ?? 0;

    return (
        <Container
            className={className}
            heading="Status Logs"
            contentClassName={styles.exportsContent}
        >
            {statusLogDataLoading && <Loading absolute />}
            {statusLogs?.map((item) => (
                <StatusLogItem
                    key={item.id}
                    triggeredDate={item.triggeredAt}
                    completedDate={item.completedAt}
                    status={item.status}
                    triggeredBy={item.triggeredBy}
                />
            ))}
            {!statusLogDataLoading && totalStatusLogsCount <= 0 && (
                <Message
                    message="No status logs found."
                />
            )}
            <Pager
                activePage={rawPage}
                itemsCount={totalStatusLogsCount}
                maxItemsPerPage={rawPageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </Container>
    );
}

export default StatusLogs;
