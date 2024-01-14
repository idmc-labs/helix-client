import React, { useEffect, useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    PopupButton,
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from '@togglecorp/toggle-ui';
import {
    IoDownload,
} from 'react-icons/io5';

import Badge from '#components/Badge';
import {
    PendingOperationsCountQuery,
    PendingOperationsCountQueryVariables,
} from '#generated/types';

import BulkActionSection from './BulkActionSection';
import ExportDownloadSection from './ExportDownloadSection';
import styles from './styles.css';

// NOTE: exporting this so that other requests can refetch this request
export const DOWNLOADS_COUNT = gql`
    query PendingOperationsCount {
        excelExports(
            filters: { statusList: ["PENDING", "IN_PROGRESS"] },
        ) {
            totalCount
        }
        bulkApiOperations(
            filters: { statusList: [PENDING, IN_PROGRESS] },
        ) {
            totalCount
        }
    }
`;

interface Props {
    className?: string;
    buttonClassName?: string;
}

function Downloads(props: Props) {
    const {
        className,
        buttonClassName,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Exports' | 'BulkActions' | undefined>('Exports');
    const [
        start,
        { data, stopPolling },
    ] = useLazyQuery<
        PendingOperationsCountQuery,
        PendingOperationsCountQueryVariables
    >(DOWNLOADS_COUNT, {
        pollInterval: 5_000,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
    });

    const exportsCount = data?.excelExports?.totalCount;
    const bulkApiOperationsCount = data?.bulkApiOperations?.totalCount;

    const totalCount = isDefined(exportsCount) && isDefined(bulkApiOperationsCount) ? (
        exportsCount + bulkApiOperationsCount
    ) : undefined;

    const allCompleted = isDefined(totalCount) && totalCount <= 0;

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

    return (
        <div className={_cs(styles.downloads, className)}>
            <PopupButton
                name={undefined}
                className={buttonClassName}
                popupClassName={styles.popup}
                popupContentClassName={styles.popupContent}
                label={<IoDownload />}
                transparent
                arrowHidden
                persistent={false}
            >
                <Tabs
                    value={selectedTab}
                    onChange={setSelectedTab}
                >
                    <TabList className={styles.tabList}>
                        <Tab name="Exports">
                            Exports
                        </Tab>
                        <Tab name="BulkActions">
                            Bulk Actions
                        </Tab>
                    </TabList>
                    <TabPanel
                        className={styles.panel}
                        name="Exports"
                    >
                        <ExportDownloadSection />
                    </TabPanel>
                    <TabPanel
                        className={styles.panel}
                        name="BulkActions"
                    >
                        <BulkActionSection />
                    </TabPanel>
                </Tabs>
            </PopupButton>
            <Badge
                className={styles.badge}
                count={totalCount}
            />
        </div>
    );
}
export default Downloads;
