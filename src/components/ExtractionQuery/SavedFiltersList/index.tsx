import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    Pager,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import {
    ExtractionQueryListQuery, ExtractionQueryListQueryVariables,
} from '#generated/types';

import QueryItem from './QueryItem';
import styles from './styles.css';

type ExtractionQuery = NonNullable<NonNullable<ExtractionQueryListQuery['extractionQueryList']>['results']>[number];

interface SavedFiltersListProps {
    className?: string;
    selectedQueryId?: string;
    extractionQueryList: ExtractionQuery[] | null | undefined;
    totalQueryCount: number;
    loading: boolean;
    onRefetchQueries: () => void;
    queryListFilters: ExtractionQueryListQueryVariables;
    setQueryListFilters: React.Dispatch<React.SetStateAction<ExtractionQueryListQueryVariables>>;
}

function SavedFiltersList(props: SavedFiltersListProps) {
    const {
        className,
        selectedQueryId,
        extractionQueryList,
        totalQueryCount,
        loading,
        onRefetchQueries,
        queryListFilters,
        setQueryListFilters,
    } = props;

    const onChangeSearchText = useCallback((text) => {
        setQueryListFilters({
            ...queryListFilters,
            search: text,
        });
    }, [queryListFilters, setQueryListFilters]);

    const onActivePageChange = useCallback((page) => {
        setQueryListFilters({
            ...queryListFilters,
            page,
        });
    }, [queryListFilters, setQueryListFilters]);

    const onItemsPerPageChange = useCallback((pageSize) => {
        setQueryListFilters({
            ...queryListFilters,
            pageSize,
        });
    }, [queryListFilters, setQueryListFilters]);

    return (
        <Container
            heading="My Saved Queries"
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <TextInput
                    icons={<IoIosSearch />}
                    name="search"
                    value={queryListFilters.search}
                    placeholder="Search"
                    onChange={onChangeSearchText}
                />
            )}
            footerContent={(
                <Pager
                    activePage={queryListFilters.page ?? 1}
                    itemsCount={totalQueryCount}
                    maxItemsPerPage={queryListFilters.pageSize ?? 10}
                    onActivePageChange={onActivePageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                />
            )}
            headerClassName={styles.header}
        >
            {totalQueryCount > 0 && extractionQueryList?.map((query) => (
                <div
                    className={query.id === selectedQueryId ? styles.selectedQuery : undefined}
                    key={query.id}
                >
                    <QueryItem
                        query={query}
                        onRefetchQueries={onRefetchQueries}
                    />
                </div>
            ))}

            {loading && <Loading absolute />}
            {!loading && totalQueryCount <= 0 && (
                <Message
                    message="No extraction query found."
                />
            )}
        </Container>
    );
}

export default SavedFiltersList;
