import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';

import { _cs } from '@togglecorp/fujs';

import {
    ExtractionQueryListQuery,
    ExtractionEntryListQueryQueryVariables,
    ExtractionQueryListQueryVariables,
} from '#generated/types';
import QuickActionLink from '#components/QuickActionLink';
import route from '#config/routes';

import ExtractionEntriesTable from './ExtractionEntriesTable';
import NewExtractionQuery from './NewExtractionQuery';
import SavedQueryList from './SavedQueryList';

import { GET_SAVED_QUERY_LIST } from './queries';

import styles from './styles.css';

interface ExtractionQueryProps {
    className?: string;
}

function ExtractionQuery(props: ExtractionQueryProps) {
    const { className } = props;
    const { queryId } = useParams<{ queryId: string }>();

    const [
        queryListFilters,
        setQueryListFilters,
    ] = useState<ExtractionQueryListQueryVariables>({
        page: 1,
        pageSize: 10,
        search: undefined,
        ordering: '-createdAt',
    });
    const [
        extractionQueryFilters,
        setExtractionQueryFilters,
    ] = useState<ExtractionEntryListQueryQueryVariables>();

    const {
        data: extractionQueries,
        loading: extractionQueriesLoading,
        refetch: refetchExtractionQueries,
    } = useQuery<ExtractionQueryListQuery>(GET_SAVED_QUERY_LIST, {
        variables: queryListFilters,
    });

    const handleRefetch = useCallback(
        () => {
            refetchExtractionQueries();
        },
        [refetchExtractionQueries],
    );

    const totalQueryCount = extractionQueries?.extractionQueryList?.totalCount ?? 0;
    const extractionQueryList = extractionQueries?.extractionQueryList?.results;
    const loading = extractionQueriesLoading;

    return (
        <div className={_cs(styles.extraction, className)}>
            <div className={styles.content}>
                <div className={styles.sideContent}>
                    <QuickActionLink
                        route={route.extractions}
                        title="Create"
                        disabled={!queryId}
                        className={styles.newQueryButton}
                    >
                        Create a new query
                    </QuickActionLink>
                    <SavedQueryList
                        className={styles.container}
                        selectedQueryId={queryId}
                        extractionQueryList={extractionQueryList}
                        totalQueryCount={totalQueryCount}
                        loading={loading}
                        onRefetchQueries={handleRefetch}
                        queryListFilters={queryListFilters}
                        setQueryListFilters={setQueryListFilters}
                    />
                </div>
                <div className={styles.mainContent}>
                    <NewExtractionQuery
                        className={styles.container}
                        id={queryId}
                        onRefetchQueries={handleRefetch}
                        setExtractionQueryFilters={setExtractionQueryFilters}
                    />
                    <ExtractionEntriesTable
                        className={styles.container}
                        extractionQueryFilters={extractionQueryFilters}
                    />
                </div>
            </div>
        </div>
    );
}

export default ExtractionQuery;
