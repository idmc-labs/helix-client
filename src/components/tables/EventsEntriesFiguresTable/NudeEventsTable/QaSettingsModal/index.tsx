import React, { useCallback, useContext, useMemo } from 'react';
import { Modal, Switch } from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

import NotificationContext from '#components/NotificationContext';
import {
    GetEventForTriangulationQuery,
    GetEventForTriangulationQueryVariables,
    UpdateEventTriangulationMutation,
    UpdateEventTriangulationMutationVariables,
} from '#generated/types';

interface Props {
    eventId: string;
    onClose: () => void;

}

const GET_EVENT_FOR_TRIANGULATION = gql`
    query GetEventForTriangulation($id: ID!) {
        event(id: $id) {
            id
            includeTriangulationInQa
        }
    }
`;

const UPDATE_EVENT_TRIANGULATION = gql`
    mutation UpdateEventTriangulation($id: ID!,$includeTriangulationInQa:Boolean) {
        updateEvent(data: {id: $id, includeTriangulationInQa: $includeTriangulationInQa}) {
            errors
            ok
            result {
                id
                includeTriangulationInQa
            }
        }
    }
`;

function QaSettingsModal(props: Props) {
    const {
        eventId,
        onClose,
    } = props;
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const eventVariables = useMemo(
        (): GetEventForTriangulationQueryVariables => ({
            id: eventId,
        }),
        [eventId],
    );

    const {
        loading: eventResponseLoading,
        previousData: eventsPreviousData,
        data: eventResponse = eventsPreviousData,
    } = useQuery<
        GetEventForTriangulationQuery,
        GetEventForTriangulationQueryVariables
    >(GET_EVENT_FOR_TRIANGULATION, {
        variables: eventVariables,
        skip: !eventVariables,
    });

    const [
        updateEventTriangulation,
        { loading: updatingEventTriangulation },
    ] = useMutation<UpdateEventTriangulationMutation, UpdateEventTriangulationMutationVariables>(
        UPDATE_EVENT_TRIANGULATION,
        {
            onCompleted: (response) => {
                const { updateEvent: updateEventRes } = response;
                if (!updateEventRes) {
                    return;
                }
                const { errors, result } = updateEventRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: result.includeTriangulationInQa
                            ? 'Triangulation figures are now included in QA.'
                            : 'Triangulation figures are now not included in QA.',
                        variant: 'success',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleChange = useCallback(
        (value: boolean) => {
            updateEventTriangulation({
                variables: {
                    id: eventId,
                    includeTriangulationInQa: value,
                },
            });
        },
        [
            eventId,
            updateEventTriangulation,
        ],
    );
    return (
        <Modal
            onClose={onClose}
            heading="QA Settings"
            size="medium"
            freeHeight
        >
            <Switch
                label="Include triangulation figures in QA"
                // FIXME: Switch does not support name=undefined
                name=""
                onChange={handleChange}
                value={eventResponse?.event?.includeTriangulationInQa}
                disabled={eventResponseLoading || updatingEventTriangulation}
            />
        </Modal>
    );
}

export default QaSettingsModal;
