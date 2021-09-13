import React, { useContext, useMemo } from 'react';
import {
    Button,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import {
    gql,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import { transformToFormError } from '#utils/errorTransform';

import { WithId } from '#utils/common';
import {
    CloneEventMutation,
    CloneEventMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const CLONE_EVENT = gql`
    mutation CloneEvent($input: CloneEventInputType!) {
        cloneEvent(data: $input) {
            ok
            errors
            result {
                id
            }
        }
    }
`;

type EventCloneFormFields = CloneEventMutationVariables['input'];
type FormType = PurgeNull<PartialForm<WithId<EventCloneFormFields>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        event: [requiredCondition],
    }),
};

interface EventCloneFormProps {
    eventId: string | undefined;
    onCloseForm: (events?: { id: string }[]) => void;
}

function EventCloneForm(props: EventCloneFormProps) {
    const {
        eventId,
        onCloseForm,
    } = props;

    const defaultFormValues = useMemo(
        (): PartialForm<FormType> => ({
            event: eventId,
        }),
        [eventId],
    );

    const {
        error,
        validate,
        onErrorSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        cloneEvent,
        { loading: updateLoading },
    ] = useMutation<CloneEventMutation, CloneEventMutationVariables>(
        CLONE_EVENT,
        {
            onCompleted: (response) => {
                const { cloneEvent: cloneEventRes } = response;
                if (!cloneEventRes) {
                    return;
                }
                const { errors, ok, result } = cloneEventRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({ children: 'Event cloned successfully!' });
                    onPristineSet(true);
                    onCloseForm(result ?? undefined);
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

    const loading = updateLoading;
    const disabled = loading;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            cloneEvent({
                variables: {
                    input: finalValues as EventCloneFormFields,
                },
            });
        }, [cloneEvent],
    );

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.cloneEvent}>
                <p>
                    This event will be cloned into events table
                    in Events page. Do you wish to clone it ?
                </p>
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onCloseForm}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled}
                    className={styles.button}
                    variant="primary"
                >
                    Ok
                </Button>
            </div>
        </form>
    );
}

export default EventCloneForm;
