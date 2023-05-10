import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
    Pager,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import {
    StatusLogsQuery,
    StatusLogsQueryVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';

import StatusLogItem from './StatusLogItem';
import Loading from '#components/Loading';
import Container from '#components/Container';

import styles from './styles.css';

const pageSize = 10;
const ordering = '-triggeredAt';

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

    const [page, setPage] = useState(1);
    const debouncedPage = useDebouncedValue(page);

    const statusLogVariables = useMemo(
        (): StatusLogsQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
        }),
        [debouncedPage],
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
                activePage={page}
                itemsCount={totalStatusLogsCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </Container>
    );
}

export default StatusLogs;
