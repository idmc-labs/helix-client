import React, { useContext } from 'react';

import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';

import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    idCondition,
    requiredStringCondition,
} from '#utils/validation';

import {
    ActorQuery,
    CreateActorMutation,
    CreateActorMutationVariables,
    UpdateActorMutation,
    UpdateActorMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const CREATE_ACTOR = gql`
    mutation CreateActor($actor: ActorCreateInputType!) {
        createActor(data: $actor) {
            result {
                id
                name
                createdAt
            }
            errors {
                field
                messages
            }
        }
    }
`;

const UPDATE_ACTOR = gql`
    mutation UpdateActor($actor: ActorUpdateInputType!) {
        updateActor(data: $actor) {
            result {
                id
                name
                createdAt
            }
            errors {
                field
                messages
            }
        }
    }
`;

const ACTOR = gql`
    query Actor($id: ID!) {
        actor(id: $id) {
            id
            name
            createdAt
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ActorFormFields = CreateActorMutationVariables['actor'];
type FormType = PurgeNull<PartialForm<WithId<ActorFormFields>>>;
const schema: Schema<FormType> = {
    fields: () => ({
        id: [idCondition],
        name: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface ActorFormProps {
    id?: string | undefined;
    onHideAddActorModal: () => void;
    onAddActorCache: MutationUpdaterFn<CreateActorMutation>;
}

function ActorForm(props:ActorFormProps) {
    const {
        id,
        onAddActorCache,
        onHideAddActorModal,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const { notify } = useContext(NotificationContext);

    const {
        loading: actorDataLoading,
        error: actorDataError,
    } = useQuery<ActorQuery>(
        ACTOR,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { actor } = response;

                if (!actor) {
                    return;
                }
                onValueSet(removeNull({ ...actor }));
            },
        },
    );

    const [
        createActor,
        { loading: createLoading },
    ] = useMutation<CreateActorMutation, CreateActorMutationVariables>(
        CREATE_ACTOR,
        {
            update: onAddActorCache,
            onCompleted: (response) => {
                const { createActor: createActorRes } = response;
                if (!createActorRes) {
                    return;
                }
                const { errors, result } = createActorRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Actor created successfully!' });
                    onPristineSet(true);
                    onHideAddActorModal();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateActor,
        { loading: updateLoading },
    ] = useMutation<UpdateActorMutation, UpdateActorMutationVariables>(
        UPDATE_ACTOR,
        {
            onCompleted: (response) => {
                const { updateActor: updateActorRes } = response;
                if (!updateActorRes) {
                    return;
                }
                const { errors, result } = updateActorRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Actor updated successfully!' });
                    onPristineSet(true);
                    onHideAddActorModal();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const loading = createLoading || actorDataLoading || updateLoading;
    const errored = !!actorDataError;
    const disabled = loading || errored;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            if (finalValues.id) {
                updateActor({
                    variables: {
                        actor: finalValues as WithId<ActorFormFields>,
                    },
                });
            } else {
                createActor({
                    variables: {
                        actor: finalValues as ActorFormFields,
                    },
                });
            }
        }, [createActor, updateActor],
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
            <div className={styles.row}>
                <TextInput
                    label="Name *"
                    value={value.name}
                    onChange={onValueChange}
                    name="name"
                    error={error?.fields?.name}
                    disabled={disabled}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onHideAddActorModal}
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

export default ActorForm;
