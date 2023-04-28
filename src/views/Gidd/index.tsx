import React, { useContext, useEffect } from 'react';
import { ConfirmButton } from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    gql,
    useLazyQuery,
    useMutation,
} from '@apollo/client';

import ReportsTable from '#components/tables/ReportsTable';
import PageHeader from '#components/PageHeader';
import NotificationContext from '#components/NotificationContext';
import DomainContext from '#components/DomainContext';
import {
    UpdateDataMutation,
    UpdateDataMutationVariables,
    PendingGiddLogsQuery,
    PendingGiddLogsQueryVariables,
} from '#generated/types';

import GiddSettings from './GiddSettings';
import StatusLogs, { STATUS_LOGS } from './StatusLogs';
import styles from './styles.css';

// NOTE: exporting this so that other requests can refetch this request
export const PENDING_STATUS_LOGS = gql`
    query PendingGiddLogs {
        giddLogs(ordering: "-triggeredAt", page: 1) {
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

const statusLogsQueryName = getOperationName(STATUS_LOGS);
const pendingStatusLogsQueryName = getOperationName(PENDING_STATUS_LOGS);

const UPDATE_DATA = gql`
    mutation UpdateData {
        giddUpdateData {
            ok
            errors
            result {
                id
                status
                completedAt
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

interface GiddProps {
    className?: string;
}

function Gidd(props: GiddProps) {
    const { className } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const { user } = useContext(DomainContext);
    const giddPermission = user?.permissions?.gidd;

    const [
        start,
        { data, stopPolling },
    ] = useLazyQuery<PendingGiddLogsQuery, PendingGiddLogsQueryVariables>(PENDING_STATUS_LOGS, {
        pollInterval: 5_000,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
    });

    const lastLog = data?.giddLogs?.results?.[0];
    const allCompleted = isDefined(lastLog) && (lastLog.status === 'SUCCESS' || lastLog.status === 'FAILED');

    // NOTE: initially fetch query then continue polling until the count is zero
    // This request can be fetched by other requests which will start the
    // polling as well
    useEffect(
        () => {
            if (!allCompleted) {
                start();
            } else if (stopPolling) {
                stopPolling();
            }
        },
        [allCompleted, start, stopPolling],
    );

    const [
        updateData,
        { loading: createLoading },
    ] = useMutation<UpdateDataMutation, UpdateDataMutationVariables>(
        UPDATE_DATA,
        {
            refetchQueries: [statusLogsQueryName, pendingStatusLogsQueryName].filter(isDefined),
            onCompleted: (response) => {
                const { giddUpdateData: giddUpdateDataRes } = response;
                if (!giddUpdateDataRes) {
                    return;
                }
                const { errors, result } = giddUpdateDataRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Gidd data update started successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleTrigger = React.useCallback(
        () => {
            updateData();
        }, [updateData],
    );

    return (
        <div className={_cs(styles.gidd, className)}>
            <div className={styles.mainContent}>
                <PageHeader
                    title="GIDD"
                    actions={giddPermission?.update_gidd_data && (
                        <ConfirmButton
                            name=""
                            disabled={createLoading || !allCompleted}
                            onConfirm={handleTrigger}
                            variant="primary"
                        >
                            {!allCompleted ? 'Updating GIDD data' : 'Update GIDD data'}
                        </ConfirmButton>
                    )}
                />
                <ReportsTable
                    title="GIDD Reports"
                    className={styles.largeContainer}
                    onlyGiddReports
                />
                <ReportsTable
                    title="Reports with Public Figure Analysis"
                    className={styles.largeContainer}
                    onlyPFAVisibleReports
                />
            </div>
            <div className={styles.sideContent}>
                <div className={styles.stickyContainer}>
                    <GiddSettings />
                    <StatusLogs
                        className={styles.largeContainer}
                    />
                </div>
            </div>
        </div>
    );
}

export default Gidd;
