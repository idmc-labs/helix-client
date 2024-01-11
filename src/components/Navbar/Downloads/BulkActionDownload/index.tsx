import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Pager } from '@togglecorp/toggle-ui';
import useFilterState from '#hooks/useFilterState';
import Message from '#components/Message';

import Loading from '#components/Loading';
import Container from '#components/Container';
import { BulkApiOperationsQuery, BulkApiOperationsQueryVariables } from '#generated/types';

import BulkActionDownloadedItem from './BulkActionDownloadItem';
import styles from './styles.css';

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
                <BulkActionDownloadedItem
                    key={item.id}
                    // TODO: once implemented on server
                    file={undefined}
                    fileSize={undefined}
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
