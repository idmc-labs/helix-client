import {
    SetStateAction,
    useReducer,
    useCallback,
    useMemo,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { EntriesAsList } from '@togglecorp/toggle-form';

import useDebouncedValue from '#hooks/useDebouncedValue';
import { hasNoData } from '#utils/common';

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

interface ResetFilterAction {
    type: 'reset-filter';
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
    ResetFilterAction
    | SetFilterAction<FILTER>
    | SetPageAction
    | SetOrderingAction
    | SetPageSizeAction
);

interface FilterState<FILTER> {
    filter: FILTER,
    initialFilter: FILTER,
    ordering: SortParameter | undefined,
    page: number,
    pageSize: number,
}

const defaultOrdering: SortParameter = {
    name: 'id',
    direction: 'dsc',
};

function useFilterState<FILTER extends Record<string, unknown>>(options: {
    filter: FILTER,
    ordering?: SortParameter | undefined,
    page?: number,
    pageSize?: number,
    debounceTime?: number,
}) {
    const {
        filter,
        ordering = defaultOrdering,
        page = 1,
        pageSize = 10,
        debounceTime = 200,
    } = options;

    type Reducer = (
        prevState: FilterState<FILTER>,
        action: FilterActions<FILTER>,
    ) => FilterState<FILTER>;

    const [state, dispatch] = useReducer<Reducer>(
        (prevState, action) => {
            if (action.type === 'reset-filter') {
                return {
                    ...prevState,
                    filter: prevState.initialFilter,
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
            page,
            pageSize,
        },
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
    const resetFilter = useCallback(
        () => {
            dispatch({
                type: 'reset-filter',
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

    return {
        rawFilter: state.filter,
        initialFilter: state.initialFilter,
        filter: debouncedState.filter,
        filterChanged: state.filter !== state.initialFilter,
        filtered,
        setFilter,
        resetFilter,
        setFilterField,

        rawPage: state.page,
        page: debouncedState.page,
        setPage,

        rawPageSize: state.pageSize,
        pageSize: debouncedState.pageSize,
        setPageSize,

        rawOrdering: getOrdering(ordering),
        ordering: getOrdering(debouncedState.ordering),
        sortState,
    };
}

export default useFilterState;
