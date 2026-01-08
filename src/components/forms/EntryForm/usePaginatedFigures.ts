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

const MAX_FIGURES_PER_PAGE = 25;

type FigureItem = NonNullable<NonNullable<NonNullable<FiguresForEntryQuery['figureList']>['results']>[number]>;

function usePaginatedFigures(
    entryId: string | undefined,
    onComplete: (figures: FigureItem[] | undefined | null) => void,
) {
    const pageRef = useRef<number>(1);
    // NOTE: Checking if figures have been set initially after first fetch of figures
    // to avoid resetting of initial figures which is happening likely because of Apollo's cache
    const figuresFetchedInitiallyRef = useRef(false);
    const [fetchPending, setFetchPending] = useState<boolean>(isDefined(entryId));
    const [errored, setErrored] = useState(false);

    const { notify } = useContext(NotificationContext);

    const variables = useMemo(
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
        skip: !variables,
        variables,
        notifyOnNetworkStatusChange: true,
        onCompleted: (response) => {
            const figuresResponse = response?.figureList?.results;
            if (!figuresResponse) {
                setFetchPending(false);
                setErrored(true);
            }
            // NOTE: the else case will be handled by the following useEffect
        },
        onError: (err) => {
            notify({
                children: err.message,
                variant: 'error',
            });
            setFetchPending(false);
            setErrored(true);
        },
    });

    const hasResponse = !!figuresData?.figureList;
    const fetchedFiguresCount = figuresData?.figureList?.results?.length;
    const totalFiguresCount = figuresData?.figureList?.totalCount;

    const figures = figuresData?.figureList?.results;

    useEffect(() => {
        // NOTE: We don't want to fetch more unless first request is complete
        if (!hasResponse || typeof totalFiguresCount !== 'number') {
            return;
        }

        // FIXME: We also need to handle cases where figures are added/deleted while
        // fetching the list. The total no. of expected figures can change in this scenario.
        if ((fetchedFiguresCount ?? 0) >= totalFiguresCount) {
            return;
        }

        pageRef.current += 1;
        fetchMoreFigures({
            variables: {
                entryId,
                page: pageRef.current,
                pageSize: MAX_FIGURES_PER_PAGE,
            },
            updateQuery: (previousResult, { fetchMoreResult }) => ({
                ...previousResult,
                ...fetchMoreResult,
                figureList: {
                    ...previousResult.figureList,
                    ...fetchMoreResult?.figureList,
                    // NOTE: we are concatenating the figues from each request to the same response
                    results: [
                        ...(previousResult.figureList?.results ?? []),
                        ...(fetchMoreResult?.figureList?.results ?? []),
                    ],
                },
            }),
        });
    }, [
        entryId,
        fetchMoreFigures,
        hasResponse,
        fetchedFiguresCount,
        totalFiguresCount,
    ]);

    useEffect(() => {
        if (!hasResponse || !figures || typeof totalFiguresCount !== 'number') {
            return;
        }

        // FIXME: We also need to handle cases where figures are added/deleted while
        // fetching the list. The total no. of expected figures can change in this scenario.
        if ((fetchedFiguresCount ?? 0) < totalFiguresCount) {
            return;
        }

        if (figuresFetchedInitiallyRef.current) {
            console.error('Figures fetch complete should not be called more than once.');
        } else {
            onComplete(figures);
            figuresFetchedInitiallyRef.current = true;
        }
        setFetchPending(false);
    }, [
        onComplete,
        hasResponse,
        fetchedFiguresCount,
        totalFiguresCount,
        // NOTE: We are splitting the if/else case into 2 separate useEffects
        // to avoid 'figures' dependency while fetching more figures
        figures,
    ]);

    return ({
        figureFetchPending: fetchPending,
        fetchedFiguresCount: fetchedFiguresCount ?? 0,
        totalFiguresCount,
        figureFetchErrored: errored,
    });
}
export default usePaginatedFigures;
