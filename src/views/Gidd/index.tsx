import React, { useContext } from 'react';
import { ConfirmButton } from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useMutation,
} from '@apollo/client';

import ReportsTable from '#components/tables/ReportsTable';
import PageHeader from '#components/PageHeader';
import NotificationContext from '#components/NotificationContext';
import {
    UpdateDataMutation,
    UpdateDataMutationVariables,
} from '#generated/types';

import GiddSettings from './GiddSettings';
import StatusLogs, { STATUS_LOGS } from './StatusLogs';
import styles from './styles.css';

const statusLogsQueryName = getOperationName(STATUS_LOGS);

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

    // TODO: Merge all PRs
    // TODO: poll on the latest status log: reference on report page
    // TODO: disable the button when there is latest pending status log
    // TODO: filter the tables by is grid report
    // TODO: filter the tables by is pfa visible in grid
    // TODO: Update report creation form
    // TODO: Add permissions for GIDD Settings and Update GIDD data

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        updateData,
        { loading: createLoading },
    ] = useMutation<UpdateDataMutation, UpdateDataMutationVariables>(
        UPDATE_DATA,
        {
            refetchQueries: statusLogsQueryName ? [statusLogsQueryName] : undefined,
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
                    actions={(
                        <ConfirmButton
                            name=""
                            disabled={createLoading}
                            onConfirm={handleTrigger}
                            variant="primary"
                        >
                            Update GIDD data
                        </ConfirmButton>
                    )}
                />
                <ReportsTable
                    title="GIDD Reports"
                    className={styles.largeContainer}
                />
                <ReportsTable
                    title="Reports with Public Figure Analysis"
                    className={styles.largeContainer}
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
