import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    PopupButton,
    Pager,
} from '@togglecorp/toggle-ui';
import {
    IoDownload,
} from 'react-icons/io5';

import Message from '#components/Message';
import {
    ExcelExportsQuery,
    ExcelExportsQueryVariables,
    ExcelExportsCountQuery,
    ExcelExportsCountQueryVariables,
} from '#generated/types';
import Loading from '#components/Loading';

import DownloadedItem from './DownloadedItem';
import styles from './styles.css';

const pageSize = 10;
const ordering = '-startedAt';

const DOWNLOADS = gql`
    query ExcelExports($ordering: String, $page: Int, $pageSize: Int) {
        excelExports(pageSize: $pageSize, page: $page, ordering: $ordering) {
            totalCount
            results {
                id
                downloadType
                startedAt
                status
                file
            }
        }
    }
`;

const DOWNLOADS_COUNT = gql`
    query ExcelExportsCount {
      excelExports(statusList: ["PENDING", "IN_PROGRESS"]) {
        totalCount
      }
    }
`;

function DownloadsSection() {
    const [page, setPage] = useState(1);

    const downloadVariables = useMemo(
        (): ExcelExportsQueryVariables => ({
            ordering,
            page,
            pageSize,
        }),
        [page],
    );

    const {
        data: downloadData,
        loading: downloadDataLoading,
    } = useQuery<ExcelExportsQuery>(DOWNLOADS, { variables: downloadVariables });

    const downloadFiles = downloadData?.excelExports?.results;
    const totalDownloadFilesCount = downloadData?.excelExports?.totalCount ?? 0;

    return (
        <>
            {downloadDataLoading && <Loading absolute />}
            {downloadFiles?.map((item) => (
                <DownloadedItem
                    key={item.id}
                    file={item.file}
                    startedDate={item.startedAt}
                    downloadType={item.downloadType}
                    status={item.status}
                />
            ))}
            {!downloadDataLoading && totalDownloadFilesCount <= 0 && (
                <Message
                    message="No exports found."
                />
            )}
            {!downloadDataLoading && totalDownloadFilesCount <= 0 && (
                <Pager
                    activePage={page}
                    itemsCount={totalDownloadFilesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    itemsPerPageControlHidden
                />
            )}
        </>
    );
}

interface Props {
    className?: string;
    buttonClassName?: string;
}

function Downloads(props: Props) {
    const {
        className,
        buttonClassName,
    } = props;

    const {
        data,
    } = useQuery<ExcelExportsCountQuery, ExcelExportsCountQueryVariables>(DOWNLOADS_COUNT, {
        pollInterval: 5_000,
        // NOTE: onCompleted is only called once if the following option is not set
        // https://github.com/apollographql/apollo-client/issues/5531
        notifyOnNetworkStatusChange: true,
    });

    const count = data?.excelExports?.totalCount ?? 0;

    return (
        <div className={_cs(styles.button, className)}>
            <PopupButton
                name={undefined}
                className={buttonClassName}
                popupClassName={styles.popup}
                popupContentClassName={styles.popupContent}
                label={<IoDownload />}
                transparent
                arrowHidden
            >
                <DownloadsSection />
            </PopupButton>
            {count > 0 && (
                <span className={styles.badge}>
                    {count}
                </span>
            )}
        </div>
    );
}
export default Downloads;
