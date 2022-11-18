import React, { useCallback } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5';
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

import FilterItem from './FilterItem';
import styles from './styles.css';

export const GET_SAVED_QUERY_LIST = gql`
    query ExtractionQueryList($search: String, $ordering: String, $page: Int, $pageSize: Int) {
        extractionQueryList(name_Unaccent_Icontains: $search, ordering: $ordering, page: $page, pageSize: $pageSize) {
            results {
                id
                name
            }
            totalCount
            pageSize
            page
        }
    }
`;

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
        // FIXME: we need to debounce setting page
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
            className={_cs(className, styles.container)}
            contentClassName={styles.content}
            headerActions={(
                <QuickActionButton
                    onClick={handleSearchFieldOpen}
                    name={undefined}
                    title="Search"
                    disabled={searchFieldOpened}
                    transparent
                >
                    <IoSearchOutline />
                </QuickActionButton>
            )}
            footerContent={(
                <Pager
                    activePage={queryListFilters.page ?? 1}
                    itemsCount={totalQueryCount}
                    maxItemsPerPage={queryListFilters.pageSize ?? 10}
                    onActivePageChange={onActivePageChange}
                    itemsPerPageControlHidden
                />
            )}
            description={searchFieldOpened && (
                <TextInput
                    name="search"
                    value={queryListFilters.search}
                    onChange={onChangeSearchText}
                    icons={<IoSearchOutline />}
                    actions={(
                        <Button
                            onClick={handleSearchFieldClose}
                            name={undefined}
                            transparent
                            title="Clear"
                            compact
                        >
                            <IoCloseOutline />
                        </Button>
                    )}
                />
            )}
        >
            {totalQueryCount > 0 && extractionQueryList?.map((query) => (
                <FilterItem
                    key={query.id}
                    selected={query.id === selectedQueryId}
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
