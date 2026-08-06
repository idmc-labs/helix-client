import {
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    useLazyQuery,
    useQuery,
} from '@apollo/client';

import NotificationContext from '#components/NotificationContext';
import {
    FiguresForEntryQuery,
    FiguresForEntryQueryVariables,
    FigureQuery,
    FigureQueryVariables,
} from '#generated/types';
import {
    FIGURE,
    FIGURES_FOR_ENTRY,
} from './queries';

const MAX_FIGURES_PER_PAGE = 5;

export type FigureItem = NonNullable<NonNullable<FiguresForEntryQuery['figureList']>['results']>[number];

function usePaginatedFigures(
    entryId: string | undefined,
    initialFigureId: string | null | undefined,
    onPageFetched: (figures: FigureItem[] | undefined | null) => void,
    onPinnedFigureFetched: (figure: FigureItem) => void,
    onPinnedFigureUnavailable: () => void,
) {
    const { notify } = useContext(NotificationContext);

    const pageRef = useRef<number>(1);

    const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(isDefined(entryId));
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [erroredInitial, setErroredInitial] = useState(false);

    const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
    const [loadedCount, setLoadedCount] = useState<number>(0);

    const initialVariables = useMemo(
        (): FiguresForEntryQueryVariables | undefined => {
            if (isNotDefined(entryId)) {
                return undefined;
            }
            return {
                entryId,
                page: 1,
                pageSize: MAX_FIGURES_PER_PAGE,
            };
        },
        [entryId],
    );

    useQuery<FiguresForEntryQuery, FiguresForEntryQueryVariables>(FIGURES_FOR_ENTRY, {
        skip: !initialVariables,
        variables: initialVariables,
        onCompleted: (response) => {
            setIsLoadingInitial(false);
            const { figureList } = response;
            if (!figureList) {
                setErroredInitial(true);
                return;
            }
            setTotalCount(figureList.totalCount ?? undefined);
            setLoadedCount(figureList.results?.length ?? 0);
            onPageFetched(figureList.results);
        },
        onError: (err) => {
            setIsLoadingInitial(false);
            setErroredInitial(true);
            notify({
                children: err.message,
                variant: 'error',
            });
        },
    });

    const [fetchNextPage] = useLazyQuery<FiguresForEntryQuery, FiguresForEntryQueryVariables>(
        FIGURES_FOR_ENTRY,
        {
            fetchPolicy: 'network-only',
            onCompleted: (response) => {
                setIsLoadingMore(false);
                const { figureList } = response;
                if (!figureList) {
                    notify({
                        children: 'Failed to load more figures.',
                        variant: 'error',
                    });
                    return;
                }
                setTotalCount(figureList.totalCount ?? undefined);
                setLoadedCount((oldValue) => oldValue + (figureList.results?.length ?? 0));
                onPageFetched(figureList.results);
            },
            onError: (err) => {
                setIsLoadingMore(false);
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
    );

    const loadMore = useCallback(() => {
        if (isNotDefined(entryId) || isLoadingMore || isLoadingInitial) {
            return;
        }
        pageRef.current += 1;
        setIsLoadingMore(true);
        fetchNextPage({
            variables: {
                entryId,
                page: pageRef.current,
                pageSize: MAX_FIGURES_PER_PAGE,
            },
        });
    }, [entryId, isLoadingMore, isLoadingInitial, fetchNextPage]);

    const hasMore = isDefined(totalCount) && loadedCount < totalCount;

    const pinnedVariables = useMemo(
        (): FigureQueryVariables | undefined => (
            isDefined(initialFigureId) ? { id: initialFigureId } : undefined
        ),
        [initialFigureId],
    );

    const [pinnedFigureLoading, setPinnedFigureLoading] = useState(isDefined(initialFigureId));

    useQuery<FigureQuery, FigureQueryVariables>(FIGURE, {
        skip: !pinnedVariables,
        variables: pinnedVariables,
        onCompleted: (response) => {
            setPinnedFigureLoading(false);
            const { figure } = response;
            if (!figure) {
                notify({
                    children: 'The figure you were looking for could not be found.',
                    variant: 'error',
                });
                onPinnedFigureUnavailable();
                return;
            }
            onPinnedFigureFetched(figure);
        },
        onError: (err) => {
            setPinnedFigureLoading(false);
            notify({
                children: err.message,
                variant: 'error',
            });
            onPinnedFigureUnavailable();
        },
    });

    return {
        isLoadingInitial,
        isLoadingMore,
        hasMore,
        loadMore,
        erroredInitial,

        totalCount,
        loadedCount,

        pinnedFigureLoading,
    };
}
export default usePaginatedFigures;
