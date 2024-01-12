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
                payload {
                    figureRole {
                        role
                    }
                }
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
        data,
        loading,
    } = useQuery<BulkApiOperationsQuery>(BULK_OPERATIONS, { variables });

    const bulkOperations = data?.bulkApiOperations?.results;
    const totalFiguresCount = data?.bulkApiOperations?.totalCount ?? 0;

    return (
        <Container contentClassName={styles.exportsContent}>
            {loading && <Loading absolute />}
            {bulkOperations?.map((item) => (
                <BulkActionDownloadedItem
                    // TOD: update date once implemented on server
                    key={item.id}
                    createdDate={item.createdAt}
                    startedDate={item.createdAt}
                    completedDate={item.createdAt}
                    failedDate={item.createdAt}
                    status={item.status}
                    figureRole={item.payload.figureRole?.role}
                    totalFiguresCount={totalFiguresCount}
                    failedFiguresCount={item.failureCount ?? 0}
                    successFiguresCount={item.successCount ?? 0}
                />
            ))}
            {!loading && totalFiguresCount <= 0 && (
                <Message
                    message="No exports found."
                />
            )}
            <Pager
                activePage={rawPage}
                itemsCount={totalFiguresCount}
                maxItemsPerPage={rawPageSize}
                onActivePageChange={setPage}
                itemsPerPageControlHidden
            />
        </Container>
    );
}

export default BulkActionDownload;
