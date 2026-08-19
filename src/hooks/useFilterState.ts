import {
    SetStateAction,
    useReducer,
    useCallback,
    useMemo,
    useEffect,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { EntriesAsList } from '@togglecorp/toggle-form';

import useDebouncedValue from '#hooks/useDebouncedValue';
import { hasNoData } from '#utils/common';
import { filterStorage, PersistenceKeyType } from '#utils/filterStorage';

export interface FilterStateResponse<T> {
    rawFilter: T;
    initialFilter: T;
    filter: T;
    filterChanged: boolean;
    filtered: boolean;
    setFilter: (value: SetStateAction<T>, updateInitialFilter?: boolean) => void;
    reset: () => void;
    setFilterField: (...args: EntriesAsList<T>) => void;

    rawPage: number;
    page: number;
    pageChanged: boolean;
    setPage: (value: number) => void;

    rawPageSize: number;
    pageSize: number;
    setPageSize: (value: number) => void;

    rawOrdering: string | undefined;
    ordering: string | undefined;
    orderingChanged: boolean;
    sortState: {
        sorting: SortParameter | undefined;
        setSorting: (value: SetStateAction<SortParameter | undefined>) => void;
    };
}

type SortDirection = 'asc' | 'dsc';
export interface SortParameter {
    name: string;
    direction: SortDirection;
}
function getOrdering(sorting: SortParameter | undefined) {
    if (isNotDefined(sorting)) {
        return undefined;
    }
    if (sorting.direction === 'asc') {
        return sorting.name;
    }
    return `-${sorting.name}`;
}

interface ResetAction {
    type: 'reset';
}

interface SetFilterAction<FILTER extends Record<string, unknown>> {
    type: 'set-filter';
    value: SetStateAction<FILTER>;
    updateInitialFilter?: boolean;
}

interface SetPageAction {
    type: 'set-page';
    value: number;
}

interface SetPageSizeAction {
    type: 'set-page-size';
    value: number;
}

interface SetOrderingAction {
    type: 'set-ordering'
    value: SetStateAction<SortParameter | undefined>;
}

type FilterActions<FILTER extends Record<string, unknown>> = (
    ResetAction
    | SetFilterAction<FILTER>
    | SetPageAction
    | SetOrderingAction
    | SetPageSizeAction
);

interface FilterState<FILTER> {
    filter: FILTER,
    initialFilter: FILTER,
    ordering: SortParameter | undefined,
    initialOrdering: SortParameter | undefined,
    page: number,
    pageSize: number,
}

function useFilterState<FILTER extends Record<string, unknown>>(options: {
    filter: FILTER,
    ordering: SortParameter,
    page?: number,
    pageSize?: number,
    debounceTime?: number,
    persistenceKey?: PersistenceKeyType,
}): FilterStateResponse<FILTER> {
    const {
        filter,
        ordering,
        page = 1,
        pageSize = 10,
        debounceTime = 200,
        persistenceKey,
    } = options;

    type Reducer = (
        prevState: FilterState<FILTER>,
        action: FilterActions<FILTER>,
    ) => FilterState<FILTER>;

    const initializer = useCallback((baseFilters: FilterState<FILTER> | undefined) => {
        if (isNotDefined(persistenceKey)) {
            return baseFilters;
        }
        const savedFilters = filterStorage.get(persistenceKey);
        if (isNotDefined(savedFilters)) {
            return baseFilters;
        }

        return savedFilters;
    }, [persistenceKey]);

    const [state, dispatch] = useReducer<Reducer, FilterState<FILTER> | undefined>(
        (prevState, action) => {
            if (action.type === 'reset') {
                return {
                    ...prevState,
                    filter: prevState.initialFilter,
                    ordering: prevState.initialOrdering,
                    page: 1,
                };
            }
            if (action.type === 'set-filter') {
                const filterValue = typeof action.value === 'function'
                    ? action.value(prevState.filter)
                    : action.value;
                return {
                    ...prevState,
                    filter: filterValue,
                    initialFilter: action.updateInitialFilter
                        ? filterValue
                        : prevState.initialFilter,
                    page: 1,
                };
            }
            if (action.type === 'set-page') {
                return {
                    ...prevState,
                    page: action.value,
                };
            }
            if (action.type === 'set-page-size') {
                return {
                    ...prevState,
                    page: 1,
                    pageSize: action.value,
                };
            }
            if (action.type === 'set-ordering') {
                return {
                    ...prevState,
                    ordering: typeof action.value === 'function'
                        ? action.value(prevState.ordering)
                        : action.value,
                    page: 1,
                };
            }
            return prevState;
        },
        {
            filter,
            initialFilter: filter,
            ordering,
            initialOrdering: ordering,
            page,
            pageSize,
        },
        initializer,
    );

    const setFilter = useCallback(
        (value: SetStateAction<FILTER>, updateInitialFilter?: boolean) => {
            dispatch({
                type: 'set-filter',
                value,
                updateInitialFilter,
            });
        },
        [],
    );

    const setFilterField = useCallback(
        (...args: EntriesAsList<FILTER>) => {
            const [val, key] = args;
            setFilter((oldFilterValue) => {
                const newFilterValue = {
                    ...oldFilterValue,
                    [key]: val,
                };
                return newFilterValue;
            });
        },
        [setFilter],
    );

    const setPage = useCallback(
        (value: number) => {
            dispatch({
                type: 'set-page',
                value,
            });
        },
        [],
    );
    const setPageSize = useCallback(
        (value: number) => {
            dispatch({
                type: 'set-page-size',
                value,
            });
        },
        [],
    );
    const setOrdering = useCallback(
        (value: SetStateAction<SortParameter | undefined>) => {
            dispatch({
                type: 'set-ordering',
                value,
            });
        },
        [],
    );
    const reset = useCallback(
        () => {
            dispatch({
                type: 'reset',
            });
        },
        [],
    );

    const debouncedState = useDebouncedValue(state, debounceTime);

    const sortState = useMemo(
        () => ({
            sorting: state.ordering,
            setSorting: setOrdering,
        }),
        [state.ordering, setOrdering],
    );

    const filtered = useMemo(
        () => !hasNoData(debouncedState.filter),
        [debouncedState.filter],
    );

    // NOTE: Compare against raw (undebounced) state so the reset button reacts
    // immediately, and reset covers every parameter retained on refresh.
    const orderingChanged = useMemo(
        () => (
            state.ordering?.name !== state.initialOrdering?.name
            || state.ordering?.direction !== state.initialOrdering?.direction
        ),
        [state.ordering, state.initialOrdering],
    );
    const pageChanged = state.page !== 1;

    useEffect(() => {
        if (persistenceKey) {
            filterStorage.set(persistenceKey, debouncedState);
        }
    }, [persistenceKey, debouncedState]);

    return {
        rawFilter: state.filter,
        initialFilter: state.initialFilter,
        filter: debouncedState.filter,
        filterChanged: state.filter !== state.initialFilter,
        filtered,
        setFilter,
        reset,
        setFilterField,

        rawPage: state.page,
        page: debouncedState.page,
        pageChanged,
        setPage,

        rawPageSize: state.pageSize,
        pageSize: debouncedState.pageSize,
        setPageSize,

        rawOrdering: getOrdering(ordering),
        ordering: getOrdering(debouncedState.ordering),
        orderingChanged,
        sortState,
    };
}

export default useFilterState;
