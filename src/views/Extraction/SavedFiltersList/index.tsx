import React, { useCallback } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5';
import {
    TextInput,
    Pager,
    Button,
} from '@togglecorp/toggle-ui';

import useFilterState from '#hooks/useFilterState';
import Message from '#components/Message';
import Container from '#components/Container';
import QuickActionButton from '#components/QuickActionButton';
import Loading from '#components/Loading';
import useBasicToggle from '#hooks/useBasicToggle';

import {
    ExtractionQueryListQuery,
    ExtractionQueryListQueryVariables,
} from '#generated/types';

import FilterItem from './FilterItem';
import styles from './styles.css';

export const GET_SAVED_QUERY_LIST = gql`
    query ExtractionQueryList(
        $search: String,
        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        extractionQueryList(
            filters: { name_Unaccent_Icontains: $search },
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
        ) {
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
    onDelete: (id: string) => void;
}

function SavedFiltersList(props: SavedFiltersListProps) {
    const {
        className,
        selectedQueryId,
        onDelete,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,

        rawFilter,
        filter,
        setFilterField,
        resetFilter,

        rawPageSize,
        pageSize,
    } = useFilterState<NonNullable<ExtractionQueryListQueryVariables>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const [
        searchFieldOpened,
        handleSearchFieldOpen,
        handleSearchFieldClose,
    ] = useBasicToggle(resetFilter);

    const {
        data: extractionQueries,
        loading: extractionQueriesLoading,
        refetch: refetchExtractionQueries,
    } = useQuery<ExtractionQueryListQuery>(GET_SAVED_QUERY_LIST, {
        variables: {
            ordering,
            page,
            pageSize,
            ...filter,
        },
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
                    activePage={rawPage}
                    itemsCount={totalQueryCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    itemsPerPageControlHidden
                />
            )}
            description={searchFieldOpened && (
                <TextInput
                    name="search"
                    value={rawFilter.search}
                    onChange={setFilterField}
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
