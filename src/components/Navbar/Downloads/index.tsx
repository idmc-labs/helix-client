import React, { useState, useMemo, useEffect } from 'react';
import { gql, useQuery, useLazyQuery } from '@apollo/client';
import { _cs, isDefined } from '@togglecorp/fujs';
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
import Container from '#components/Container';

import DownloadedItem from './DownloadedItem';
import styles from './styles.css';

const pageSize = 10;
const ordering = '-createdAt';

const DOWNLOADS = gql`
    query ExcelExports($ordering: String, $page: Int, $pageSize: Int) {
        excelExports(pageSize: $pageSize, page: $page, ordering: $ordering) {
            totalCount
            results {
                id
                downloadType
                startedAt
                completedAt
                createdAt
                status
                file
                fileSize
            }
        }
        excelRemainingExports: excelExports(statusList: ["PENDING", "IN_PROGRESS"]) {
            totalCount
        }
    }
`;

// NOTE: exporting this so that other requests can refetch this request
export const DOWNLOADS_COUNT = gql`
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
        <Container
            heading="Exports"
            borderless
            contentClassName={styles.exportsContent}
        >
            {downloadDataLoading && <Loading absolute />}
            {downloadFiles?.map((item) => (
                <DownloadedItem
                    key={item.id}
                    file={item.file}
                    fileSize={item.fileSize}
                    startedDate={item.startedAt}
                    completedDate={item.completedAt}
                    createdDate={item.createdAt}
                    downloadType={item.downloadType}
                    status={item.status}
                />
            ))}
            {!downloadDataLoading && totalDownloadFilesCount <= 0 && (
                <Message
                    message="No exports found."
                />
            )}
            <Pager
                activePage={page}
                itemsCount={totalDownloadFilesCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </Container>
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
            {isDefined(count) && count > 0 && (
                <span className={styles.badge}>
                    {count}
                </span>
            )}
        </div>
    );
}
export default Downloads;
