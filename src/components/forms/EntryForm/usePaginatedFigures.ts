import { useEffect, useState, useContext, useMemo, useRef } from 'react';

import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    useQuery,
} from '@apollo/client';

import NotificationContext from '#components/NotificationContext';
import {
    FiguresForEntryQuery,
    FiguresForEntryQueryVariables,
} from '#generated/types';
import {
    FIGURES_FOR_ENTRY,
} from './queries';

const MAX_FIGURES_PER_PAGE = 50;

type FigureItem = NonNullable<NonNullable<NonNullable<FiguresForEntryQuery['figureList']>['results']>[number]>;

function usePaginatedFigures(
    entryId: string | undefined,
    onComplete: (figures: FigureItem[] | undefined | null) => void,
) {
    const figurePageRef = useRef<number>(1);
    const [figureFetchPending, setFigureFetchPending] = useState<boolean>(isDefined(entryId));
    const [errored, setErrored] = useState(false);

    const {
        notify,
    } = useContext(NotificationContext);

    const variablesForFiguresQuery = useMemo(
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
    const {
        previousData: previousFiguresData,
        data: figuresData = previousFiguresData,
        fetchMore: fetchMoreFigures,
    } = useQuery<FiguresForEntryQuery, FiguresForEntryQueryVariables>(FIGURES_FOR_ENTRY, {
        skip: !variablesForFiguresQuery,
        variables: variablesForFiguresQuery,
        notifyOnNetworkStatusChange: true,
        onCompleted: (response) => {
            const figuresResponse = response?.figureList?.results;
            if (!figuresResponse) {
                setFigureFetchPending(false);
                setErrored(true);
            }
        },
        onError: (err) => {
            notify({
                children: err.message,
                variant: 'error',
            });
            setErrored(true);
            setFigureFetchPending(false);
        },
    });

    const hasResponse = !!figuresData?.figureList;
    const fetchedSoFar = figuresData?.figureList?.results?.length;
    const totalFiguresCount = figuresData?.figureList?.totalCount;
    const figures = figuresData?.figureList?.results;

    useEffect(() => {
        if (!hasResponse) {
            return;
        }

        if ((fetchedSoFar ?? 0) < (totalFiguresCount ?? 0)) {
            fetchMoreFigures({
                variables: {
                    entryId,
                    page: figurePageRef.current + 1,
                    pageSize: MAX_FIGURES_PER_PAGE,
                },
                updateQuery: (previousResult, { fetchMoreResult }) => ({
                    ...previousResult,
                    ...fetchMoreResult,
                    figureList: {
                        ...previousResult.figureList,
                        ...fetchMoreResult?.figureList,
                        results: [
                            ...(previousResult.figureList?.results ?? []),
                            ...(fetchMoreResult?.figureList?.results ?? []),
                        ],
                    },
                }),
            });
            figurePageRef.current += 1;
        }
    }, [
        entryId,
        fetchMoreFigures,
        hasResponse,
        fetchedSoFar,
        totalFiguresCount,
    ]);

    useEffect(() => {
        if (!hasResponse) {
            return;
        }
        if (
            isDefined(figures)
            && typeof totalFiguresCount === 'number'
            && figures?.length === totalFiguresCount
        ) {
            onComplete(figures);
            setFigureFetchPending(false);
        }
    }, [
        onComplete,
        hasResponse,
        figures,
        totalFiguresCount,
    ]);

    return ({
        figuresData,
        figureFetchPending,
        totalFiguresCount: figuresData?.figureList?.totalCount ?? 0,
        figureFetchErrored: errored,
    });
}
export default usePaginatedFigures;
