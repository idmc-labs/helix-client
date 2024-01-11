import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager } from '@togglecorp/toggle-ui';

import useFilterState from '#hooks/useFilterState';
import Message from '#components/Message';
import {
    ExcelExportsQuery,
    ExcelExportsQueryVariables,
} from '#generated/types';

import Loading from '#components/Loading';
import Container from '#components/Container';

import DownloadedItem from './DownloadedItem';
import styles from './styles.css';

const DOWNLOADS = gql`
    query ExcelExports(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        excelExports(
            pageSize: $pageSize,
            page: $page,
            ordering: $ordering,
        ) {
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
        excelRemainingExports: excelExports(
            filters: { statusList: ["PENDING", "IN_PROGRESS"] },
        ) {
            totalCount
        }
    }
`;

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

function ExportDownloadSection() {
    const {
        page,
        rawPage,
        setPage,
        pageSize,
        rawPageSize,
    } = useFilterState({
        filter: {},
    });

    const downloadVariables = useMemo(
        (): ExcelExportsQueryVariables => ({
            ordering: '-created_at',
            page,
            pageSize,
        }),
        [page, pageSize],
    );

    const {
        data: downloadData,
        loading: downloadDataLoading,
    } = useQuery<ExcelExportsQuery>(DOWNLOADS, { variables: downloadVariables });

    const downloadFiles = downloadData?.excelExports?.results;
    const totalDownloadFilesCount = downloadData?.excelExports?.totalCount ?? 0;

    return (
        <Container contentClassName={styles.exportsContent}>
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
                activePage={rawPage}
                itemsCount={totalDownloadFilesCount}
                maxItemsPerPage={rawPageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </Container>
    );
}

export default ExportDownloadSection;
