import { useState, useRef, useCallback, useMemo } from 'react';

// TODO: Change the batchSize later
function useBulkSaveRegister<
    ErrorResponse,
    SaveResponse,
    DeleteResponse,
    DeleteRequest,
    SaveRequest,
>(batchSize = 2) {
    const [pending, setPending] = useState(false);

    interface Entries {
        // Store the results
        errorResponses: ErrorResponse[],
        saveResponses: SaveResponse[],
        deleteResponses: DeleteResponse[],

        // Store the input
        deleteRequests: DeleteRequest[],
        saveRequests: SaveRequest[],

        // State
        state: {
            deleteRequests: DeleteRequest[],
            saveRequests: SaveRequest[],
        },
    }

    const defaultState = useMemo<Entries>(
        () => ({
            errorResponses: [],
            saveResponses: [],
            deleteResponses: [],

            deleteRequests: [],
            saveRequests: [],

            state: {
                deleteRequests: [],
                saveRequests: [],
            },
        }),
        [],
    );

    const entriesRef = useRef<Entries>(defaultState);

    const start = useCallback(
        (args: {
            deleteRequests: DeleteRequest[],
            saveRequests: SaveRequest[],
        }) => {
            entriesRef.current = {
                ...defaultState,
                ...args,
                state: {
                    deleteRequests: args.deleteRequests,
                    saveRequests: args.saveRequests,
                    // NOTE: we might need to not set this here
                },
            };
            // NOTE: We don't even start if there are no items
            setPending(args.deleteRequests.length + args.saveRequests.length > 0);
        },
        [defaultState],
    );

    const end = useCallback(
        () => {
            const state = entriesRef.current;
            entriesRef.current = defaultState;
            setPending(false);
            return state;
        },
        [defaultState],
    );

    const getNextRequests = useCallback(
        () => {
            const nextDeleteRequests = entriesRef.current.state.deleteRequests.slice(
                0,
                batchSize,
            );
            const batchSizeForUpdate = batchSize - nextDeleteRequests.length;
            const nextSaveRequests = entriesRef.current.state.saveRequests.slice(
                0,
                batchSizeForUpdate,
            );

            const state = {
                deleteRequests: nextDeleteRequests,
                saveRequests: nextSaveRequests,
                isEmpty: nextDeleteRequests.length === 0 && nextSaveRequests.length === 0,
            };

            entriesRef.current = {
                ...entriesRef.current,
                state: {
                    deleteRequests: entriesRef.current.state.deleteRequests.slice(batchSize),
                    saveRequests: entriesRef.current.state.saveRequests.slice(batchSizeForUpdate),
                },
            };
            return state;
        },
        [batchSize],
    );

    const updateResponses = useCallback(
        (args: {
            errorResponses?: ErrorResponse[] | null,
            saveResponses?: SaveResponse[] | null,
            deleteResponses?: DeleteResponse[] | null,
        }) => {
            entriesRef.current = {
                ...entriesRef.current,
                errorResponses: [
                    ...entriesRef.current.errorResponses,
                    ...(args.errorResponses ?? []),
                ],
                saveResponses: [
                    ...entriesRef.current.saveResponses,
                    ...(args.saveResponses ?? []),
                ],
                deleteResponses: [
                    ...entriesRef.current.deleteResponses,
                    ...(args.deleteResponses ?? []),
                ],
            };
        },
        [],
    );

    return {
        pending,
        start,
        updateResponses,
        end,
        getNextRequests,
    };
}

export default useBulkSaveRegister;
