import React, { useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { Pager } from '@togglecorp/toggle-ui';
import useFilterState from '#hooks/useFilterState';
import Message from '#components/Message';

import Loading from '#components/Loading';
import Container from '#components/Container';
import DownloadedItem from '../DownloadedItem';

import styles from './styles.css';
import { BulkApiOperationsQuery, BulkApiOperationsQueryVariables } from '#generated/types';

const BULK_OPERATIONS = gql`
    query BulkApiOperations(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        bulkApiOperations(
            ordering: $ ordering,
            page: $page,
            pageSize: $pageSize
        ) {
            results {
                id
                status
                statusDisplay
                action
                actionDisplay
                createdAt
                failureCount
                successCount
            }
            totalCount
            page
            pageSize
        }
    }
`;

function BulkActionDownload() {
    const {
        page,
        rawPage,
        setPage,
        pageSize,
        rawPageSize,
    } = useFilterState({
        filter: {},
    });

    const variables = useMemo(
        (): BulkApiOperationsQueryVariables => ({
            ordering: '-created_at',
            page,
            pageSize,
        }),
        [page, pageSize],
    );

    const {
        data: downloadData,
        loading: downloadDataLoading,
    } = useQuery<BulkApiOperationsQuery>(BULK_OPERATIONS, { variables });

    // TODO:
    const downloadFiles = downloadData?.bulkApiOperations?.results;
    const totalDownloadFilesCount = downloadData?.bulkApiOperations?.totalCount ?? 0;

    return (
        <Container contentClassName={styles.exportsContent}>
            {downloadDataLoading && <Loading absolute />}
            {downloadFiles?.map((item) => (
                <DownloadedItem
                    key={item.id}
                    // file={item.file}
                    // fileSize={item.fileSize}
                    startedDate={item.createdAt}
                    completedDate={item.createdAt}
                    createdDate={item.createdAt}
                    downloadType={item.actionDisplay}
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

export default BulkActionDownload;
