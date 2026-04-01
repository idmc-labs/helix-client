import React, { useMemo } from 'react';
import { isDefined } from '@togglecorp/fujs';
import { Pager } from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import useFilterState from '#hooks/useFilterState';
import {
    AhhsActivityLogQuery,
    AhhsActivityLogQueryVariables,
} from '#generated/types';

import ActivityLogItem from './ActivityLogItem';
import styles from './styles.module.css';

// NOTE: exporting this so that other requests can refetch this request
export const AHHS_ACTIVITY_LOG = gql`
    query AhhsActivityLog(
        $page: Int,
        $pageSize: Int,
        $ordering: String,
    ) {
        householdSizeBulkOperationList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize
        ) {
            results {
                id
                status
                createdAt
                createdBy {
                    id
                    fullName
                }
                completedAt
                startedAt
                modifiedAt
                failureReasons
                targetYear
                versionId
            }
            totalCount
            page
            pageSize
        }
    }
`;

interface ActivityLogsProps {
    className?: string;
}

function ActivityLogs(props: ActivityLogsProps) {
    const {
        className,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        rawPageSize,
        pageSize,
    } = useFilterState({
        filter: {},
    });

    const activityLogVariables = useMemo(
        (): AhhsActivityLogQueryVariables => ({
            ordering: '-created_at',
            page,
            pageSize,
        }),
        [page, pageSize],
    );
    const {
        data: ahhsActivitiesResponse,
        loading: ahhsActivitiesLoading,
    } = useQuery<AhhsActivityLogQuery, AhhsActivityLogQueryVariables>(
        AHHS_ACTIVITY_LOG,
        {
            variables: activityLogVariables,
        },
    );

    const ahhsActivities = ahhsActivitiesResponse
        ?.householdSizeBulkOperationList?.results;
    const totalAhhsActivitiesCount = ahhsActivitiesResponse
        ?.householdSizeBulkOperationList?.totalCount ?? 0;

    return (
        <Container
            className={className}
            heading="Status Logs"
            contentClassName={styles.content}
        >
            {ahhsActivitiesLoading && <Loading absolute />}
            {ahhsActivities?.map((item) => (
                <ActivityLogItem
                    key={item.id}
                    startedDate={item.startedAt ?? ''}
                    completedDate={item.completedAt ?? ''}
                    status={item.status}
                    triggeredBy={item.createdBy}
                    targetYear={item.targetYear}
                    failureReasons={item.failureReasons}
                />
            ))}
            {!ahhsActivitiesLoading
                && isDefined(totalAhhsActivitiesCount)
                && totalAhhsActivitiesCount <= 0 && (
                <Message
                    message="No activity logs found."
                />
            )}
            <Pager
                activePage={rawPage}
                itemsCount={totalAhhsActivitiesCount}
                maxItemsPerPage={rawPageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </Container>
    );
}

export default ActivityLogs;
