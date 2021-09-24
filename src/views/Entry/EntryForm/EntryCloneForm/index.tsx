import React, { useContext, useMemo, useState } from 'react';
import {
    Button,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredListCondition,
    requiredCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import EventMultiSelectInput, { EventOption } from '#components/selections/EventMultiSelectInput';

import { transformToFormError } from '#utils/errorTransform';

import { WithId } from '#utils/common';
import {
    EntryForCloneQuery,
    EntryForCloneQueryVariables,
    CloneEntryMutation,
    CloneEntryMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const CLONE_ENTRY = gql`
    mutation CloneEntry($input: CloneEntryInputType!) {
        cloneEntry(data: $input) {
            ok
            errors
            result {
                id
            }
        }
    }
`;

const ENTRY = gql`
    query EntryForClone($id: ID!) {
        entry(id: $id) {
            id
            articleTitle
            event {
                id
                name
            }
        }
    }
`;

type EventCloneFormFields = CloneEntryMutationVariables['input'];
type FormType = PurgeNull<PartialForm<WithId<EventCloneFormFields>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        entry: [requiredCondition],
        events: [requiredListCondition],
    }),
};

interface EventCloneFormProps {
    entryId: string;
    onCloseForm: (entries?: { id: string }[]) => void;
}

function EventCloneForm(props: EventCloneFormProps) {
    const {
        entryId,
        onCloseForm,
    } = props;

    const [
        eventOptions,
        setEventOptions,
    ] = useState<EventOption[] | undefined | null>();

    const defaultFormValues = useMemo(
        (): PartialForm<FormType> => ({
            entry: entryId,
        }),
        [entryId],
    );

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const entryVariables = useMemo(
        (): EntryForCloneQueryVariables | undefined => (
            { id: entryId }
        ), [entryId],
    );

    const {
        loading: entryDataLoading,
        error: entryDataError,
        data: entryData,
    } = useQuery<EntryForCloneQuery>(
        ENTRY,
        {
            skip: !entryVariables,
            variables: entryVariables,
        },
    );

    const [
        cloneEntry,
        { loading: updateLoading },
    ] = useMutation<CloneEntryMutation, CloneEntryMutationVariables>(
        CLONE_ENTRY,
        {
            onCompleted: (response) => {
                const { cloneEntry: cloneEntryRes } = response;
                if (!cloneEntryRes) {
                    return;
                }
                const { errors, ok, result } = cloneEntryRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Entry cloned successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onCloseForm(result ?? undefined);
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const loading = entryDataLoading || updateLoading;
    const errored = !!entryDataError;
    const disabled = loading || errored;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            cloneEntry({
                variables: {
                    input: finalValues as EventCloneFormFields,
                },
            });
        }, [cloneEntry],
    );

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            {entryData?.entry && (
                <p>
                    {/* eslint-disable-next-line react/jsx-one-expression-per-line, max-len */}
                    Please select the events to clone the entry <b>{entryData.entry.articleTitle}</b> from event <b>{entryData.entry.event.name}</b>
                </p>
            )}
            <p>
                NOTE: The figures in this entry will not be cloned.
            </p>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <EventMultiSelectInput
                    label="Events *"
                    options={eventOptions}
                    name="events"
                    onOptionsChange={setEventOptions}
                    onChange={onValueChange}
                    value={value.events}
                    error={error?.fields?.events?.$internal}
                    disabled={disabled}
                />
            </Row>
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
                    disabled={disabled || pristine}
                    className={styles.button}
                    variant="primary"
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default EventCloneForm;
