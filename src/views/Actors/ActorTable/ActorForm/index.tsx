import React, { useContext, useMemo, useState } from 'react';

import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    requiredStringCondition,
    idCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import CountrySelectInput, { CountryOption } from '#components/selections/CountrySelectInput';

import { transformToFormError } from '#utils/errorTransform';

import {
    ActorQuery,
    ActorQueryVariables,
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
                country {
                    id
                    idmcShortName
                }
                torg
            }
            errors
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
                country {
                    id
                    idmcShortName
                }
                torg
            }
            errors
        }
    }
`;

const ACTOR = gql`
    query Actor($id: ID!) {
        actor(id: $id) {
            id
            name
            createdAt
            country {
                id
                idmcShortName
            }
            torg
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ActorFormFields = CreateActorMutationVariables['actor'];
type FormType = PurgeNull<PartialForm<WithId<ActorFormFields>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        name: [requiredStringCondition],
        country: [requiredCondition],
        torg: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface ActorFormProps {
    id?: string | undefined;
    onHideAddActorModal: () => void;
    onAddActorCache: MutationUpdaterFn<CreateActorMutation>;
}

function ActorForm(props: ActorFormProps) {
    const {
        id,
        onAddActorCache,
        onHideAddActorModal,
    } = props;

    const [
        countryOptions,
        setCountryOptions,
    ] = useState<CountryOption[] | undefined | null>();

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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const actorVariables = useMemo(
        (): ActorQueryVariables | undefined => (
            id ? { id } : undefined
        ), [id],
    );

    const {
        loading: actorDataLoading,
        error: actorDataError,
    } = useQuery<ActorQuery>(
        ACTOR,
        {
            skip: !actorVariables,
            variables: actorVariables,
            onCompleted: (response) => {
                const { actor } = response;

                if (!actor) {
                    return;
                }
                if (actor.country) {
                    setCountryOptions([actor.country]);
                }
                onValueSet(removeNull({
                    ...actor,
                    country: actor.country?.id,
                }));
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
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({ children: 'Actor created successfully!' });
                    onPristineSet(true);
                    onHideAddActorModal();
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
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({ children: 'Actor updated successfully!' });
                    onPristineSet(true);
                    onHideAddActorModal();
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
            <Row>
                <TextInput
                    label="Name *"
                    value={value.name}
                    onChange={onValueChange}
                    name="name"
                    error={error?.fields?.name}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <CountrySelectInput
                    label="Country *"
                    options={countryOptions}
                    name="country"
                    onOptionsChange={setCountryOptions}
                    onChange={onValueChange}
                    value={value.country}
                    error={error?.fields?.country}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <TextInput
                    label="Torg "
                    value={value.torg}
                    onChange={onValueChange}
                    name="torg"
                    error={error?.fields?.torg}
                    disabled={disabled}
                />
            </Row>
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
