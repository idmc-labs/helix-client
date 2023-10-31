import React, { useState, useContext, useMemo } from 'react';
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
    requiredCondition,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import UserSelectInput, { UserOption } from '#components/selections/UserSelectInput';

import { transformToFormError } from '#utils/errorTransform';

import {
    EventAssigneeInfoQuery,
    EventAssigneeInfoQueryVariables,
    SetAssigneeToEventMutation,
    SetAssigneeToEventMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const SET_ASSIGNEE_TO_EVENT = gql`
    mutation SetAssigneeToEvent($eventId: ID!, $userId: ID!) {
        setAssigneeToEvent(eventId: $eventId, userId: $userId) {
            errors
            result {
                id
                assignee {
                    id
                    fullName
                    isActive
                }
            }
        }
    }
`;

const EVENT_ASSIGNEE_INFO = gql`
    query EventAssigneeInfo($id: ID!) {
        event(id: $id) {
            id
            assignee {
                fullName
                id
                isActive
            }
        }
    }
`;

type AssigneeChangeFormFields = SetAssigneeToEventMutationVariables;
type FormType = PurgeNull<PartialForm<AssigneeChangeFormFields>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        eventId: [requiredCondition],
        userId: [requiredCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

// const permissions: `${PermissionAction}_${PermissionEntity}`[] = [
const permissions: string[] = [
    'approve_figure',
];

interface Props {
    id: string;
    onFormCancel: () => void;
}

function AssigneeChangeForm(props: Props) {
    const {
        id,
        onFormCancel,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        assignedToOptions,
        setAssignedToOptions,
    ] = useState<UserOption[] | null | undefined>();

    const eventAssigneeInfoVariables = useMemo(
        (): EventAssigneeInfoQueryVariables | undefined => ({ id }),
        [id],
    );

    const {
        loading: loadingEvent,
    } = useQuery<EventAssigneeInfoQuery, EventAssigneeInfoQueryVariables>(EVENT_ASSIGNEE_INFO, {
        skip: !eventAssigneeInfoVariables,
        variables: eventAssigneeInfoVariables,
        onCompleted: (response) => {
            const { event } = response;
            if (event) {
                if (event.assignee) {
                    setAssignedToOptions([event.assignee]);
                }
                onValueSet({
                    eventId: event.id,
                    userId: event.assignee?.id,
                });
            }
        },
    });

    const [
        setAssigneeToEvent,
        { loading: setAssigneeLoading },
    ] = useMutation<SetAssigneeToEventMutation, SetAssigneeToEventMutationVariables>(
        SET_ASSIGNEE_TO_EVENT,
        {
            onCompleted: (response) => {
                const { setAssigneeToEvent: setAssigneeToEventRes } = response;
                if (!setAssigneeToEventRes) {
                    return;
                }
                const { errors } = setAssigneeToEventRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                    return;
                }
                notify({
                    children: 'Assignee updated successfully!',
                    variant: 'success',
                });
                onPristineSet(true);
                onFormCancel();
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

    const loading = setAssigneeLoading;
    const disabled = loading || loadingEvent;

    const handleSubmit = React.useCallback(
        (finalValues: FormType) => {
            setAssigneeToEvent({
                variables: finalValues as AssigneeChangeFormFields,
            });
        }, [setAssigneeToEvent],
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
            <UserSelectInput
                label="Assignee *"
                name="userId"
                onChange={onValueChange}
                value={value.userId}
                disabled={disabled}
                options={assignedToOptions}
                onOptionsChange={setAssignedToOptions}
                error={error?.fields?.userId}
                permissions={permissions}
                autoFocus
            />
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onFormCancel}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                >
                    Save
                </Button>
            </div>
        </form>
    );
}

export default AssigneeChangeForm;
