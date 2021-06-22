import React, { useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoIosSearch, IoMdClose } from 'react-icons/io';
import {
    TextInput,
    Pager,
    Button,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';
import Loading from '#components/Loading';
import useBasicToggle from '#hooks/toggleBasicState';

import {
    ExtractionQueryListQuery,
    ExtractionQueryListQueryVariables,
} from '#generated/types';

import { GET_SAVED_QUERY_LIST } from '../queries';
import FilterItem from './FilterItem';
import styles from './styles.css';

interface SavedFiltersListProps {
    className?: string;
    selectedQueryId?: string;
    queryListFilters: ExtractionQueryListQueryVariables;
    setQueryListFilters: React.Dispatch<React.SetStateAction<ExtractionQueryListQueryVariables>>;
    onDelete: (id: string) => void;
}

function SavedFiltersList(props: SavedFiltersListProps) {
    const {
        className,
        selectedQueryId,
        queryListFilters,
        setQueryListFilters,
        onDelete,
    } = props;

    const onResetSearchText = useCallback(() => {
        setQueryListFilters({
            ...queryListFilters,
            search: undefined,
        });
    }, [queryListFilters, setQueryListFilters]);

    const onChangeSearchText = useCallback((text: string | undefined | null) => {
        setQueryListFilters({
            ...queryListFilters,
            search: text,
        });
    }, [queryListFilters, setQueryListFilters]);

    const [
        searchFieldOpened,
        handleSearchFieldOpen,
        handleSearchFieldClose,
    ] = useBasicToggle(onResetSearchText);

    const onActivePageChange = useCallback((page) => {
        setQueryListFilters({
            ...queryListFilters,
            page,
        });
    }, [queryListFilters, setQueryListFilters]);

    const {
        data: extractionQueries,
        loading: extractionQueriesLoading,
        refetch: refetchExtractionQueries,
    } = useQuery<ExtractionQueryListQuery>(GET_SAVED_QUERY_LIST, {
        variables: queryListFilters,
    });

    // NOTE: cannot pass refetchExtractionQueries to query.update
    const refetchFilterItems = useCallback(
        () => {
            refetchExtractionQueries();
        },
        [refetchExtractionQueries],
    );

    const totalQueryCount = extractionQueries?.extractionQueryList?.totalCount ?? 0;
    const extractionQueryList = extractionQueries?.extractionQueryList?.results;
    const loading = extractionQueriesLoading;

    return (
        <Container
            heading="My Saved Queries"
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={!searchFieldOpened && (
                <QuickActionButton
                    onClick={handleSearchFieldOpen}
                    name={undefined}
                    title="Search"
                >
                    <IoIosSearch />
                </QuickActionButton>
            )}
            footerContent={(
                <Pager
                    activePage={queryListFilters.page ?? 1}
                    itemsCount={totalQueryCount}
                    maxItemsPerPage={queryListFilters.pageSize ?? 10}
                    onActivePageChange={onActivePageChange}
                    itemsPerPageControlHidden
                    onItemsPerPageChange={undefined}
                />
            )}
        >
            {searchFieldOpened && (
                <TextInput
                    name="search"
                    className={styles.searchInput}
                    value={queryListFilters.search}
                    onChange={onChangeSearchText}
                    icons={<IoIosSearch />}
                    actions={(
                        <Button
                            className={styles.clearButton}
                            onClick={handleSearchFieldClose}
                            name={undefined}
                            transparent
                            title="Clear"
                            compact
                        >
                            <IoMdClose />
                        </Button>
                    )}
                />
            )}
            {totalQueryCount > 0 && extractionQueryList?.map((query) => (
                <FilterItem
                    key={query.id}
                    className={query.id === selectedQueryId ? styles.selectedQuery : undefined}
                    query={query}
                    onRefetchQueries={refetchFilterItems}
                    onDelete={onDelete}
                />
            ))}
            {loading && <Loading absolute />}
            {!loading && totalQueryCount <= 0 && (
                <Message
                    message="No saved query found."
                />
            )}
        </Container>
    );
}

export default SavedFiltersList;
