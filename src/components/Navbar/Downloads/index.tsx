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
    ExcelExportsCountQuery,
    ExcelExportsCountQueryVariables,
} from '#generated/types';

import BulkActionDownload from './BulkActionDownload';
import ExportDownloadSection from './ExportDownloadSection';
import styles from './styles.css';

// NOTE: exporting this so that other requests can refetch this request
export const DOWNLOADS_COUNT = gql`
    query ExcelExportsCount {
      excelExports(
        filters: { statusList: ["PENDING", "IN_PROGRESS"] },
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
    ] = useLazyQuery<ExcelExportsCountQuery, ExcelExportsCountQueryVariables>(DOWNLOADS_COUNT, {
        pollInterval: 5_000,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
        fetchPolicy: 'network-only',
    });

    const count = data?.excelExports?.totalCount;
    const allCompleted = isDefined(count) && count <= 0;

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
                        <Tab name="Exports"> Exports </Tab>
                        <Tab name="BulkActions"> Bulk Actions </Tab>
                    </TabList>
                    <TabPanel name="Exports">
                        <ExportDownloadSection />
                    </TabPanel>
                    <TabPanel name="BulkActions">
                        <BulkActionDownload />
                    </TabPanel>
                </Tabs>
            </PopupButton>
            <Badge
                className={styles.badge}
                count={count}
            />
        </div>
    );
}
export default Downloads;
