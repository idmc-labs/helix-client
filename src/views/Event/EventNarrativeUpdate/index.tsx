import React, { useCallback, useContext, useMemo } from 'react';
import {
    Button,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredStringCondition,
    idCondition,
} from '@togglecorp/toggle-form';
import { useMutation, useQuery, gql } from '@apollo/client';

import { transformToFormError } from '#utils/errorTransform';

import Loading from '#components/Loading';
import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import MarkdownEditor from '#components/MarkdownEditor';

import { WithId } from '#utils/common';
import {
    EventNarrativeQuery,
    EventNarrativeQueryVariables,
    UpdateEventNarrativeMutation,
    UpdateEventNarrativeMutationVariables,
} from '#generated/types';

import styles from './styles.css';

export const FETCH_EVENT_NARRATIVE = gql`
    query EventNarrative($id: ID!) {
        event(id: $id) {
            id
            eventNarrative
        }
    }
`;

export const UPDATE_EVENT_NARRATIVE = gql`
    mutation UpdateEventNarrative($event: EventUpdateInputType!) {
        updateEvent(data: $event) {
            result {
                id
                eventNarrative
            }
            errors
        }
    }
`;

type EventNarrativeFormFields = UpdateEventNarrativeMutationVariables['event'];
type FormType = PurgeNull<PartialForm<WithId<EventNarrativeFormFields>>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        eventNarrative: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface UpdateEventNarrativeProps {
    id?: string;
    onFormCancel?: () => void;
}

function EventNarrativeUpdateForm(props: UpdateEventNarrativeProps) {
    const {
        id,
        onFormCancel,
    } = props;

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
        pristine,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const narrativeVariables = useMemo(
        (): EventNarrativeQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: narrativeLoading,
    } = useQuery<EventNarrativeQuery>(
        FETCH_EVENT_NARRATIVE,
        {
            skip: !narrativeVariables,
            variables: narrativeVariables,
            onCompleted: (response) => {
                const { event } = response;
                if (!event) {
                    return;
                }
                onValueSet(removeNull({ ...event }));
            },
        },
    );

    const [
        updateEventNarrative,
        { loading: updateNarrativeLoading },
    ] = useMutation<
        UpdateEventNarrativeMutation,
        UpdateEventNarrativeMutationVariables
    >(
        UPDATE_EVENT_NARRATIVE,
        {
            onCompleted: (response) => {
                const { updateEvent } = response;
                if (!updateEvent) {
                    return;
                }
                const { errors } = updateEvent;
                if (errors) {
                    const updateNarrativeError = transformToFormError(removeNull(errors));
                    onErrorSet(updateNarrativeError);
                    notifyGQLError(errors);
                } else {
                    notify({ children: 'Event Narrative updated successfully!' });
                    if (onFormCancel) {
                        onFormCancel();
                    }
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback((finalValue: FormType) => {
        updateEventNarrative({
            variables: {
                event: finalValue as EventNarrativeFormFields,
            },
        });
    }, [updateEventNarrative]);

    const loading = narrativeLoading || updateNarrativeLoading;

    return (
        <form
            className={styles.narrativeForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                onChange={onValueChange}
                value={value.eventNarrative}
                name="eventNarrative"
                error={error?.fields?.eventNarrative}
                disabled={loading}
            />
            {(value.eventNarrative) && (
                <FormActions className={styles.actions}>
                    <Button
                        name={undefined}
                        onClick={onFormCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        name={undefined}
                        variant="primary"
                        type="submit"
                        disabled={pristine || loading || !value.eventNarrative}
                    >
                        Submit
                    </Button>
                </FormActions>
            )}
        </form>
    );
}

export default EventNarrativeUpdateForm;
