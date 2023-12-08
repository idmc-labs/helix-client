import React, { useContext, useCallback, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
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
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import BooleanInput from '#components/selections/BooleanInput';

import { transformToFormError } from '#utils/errorTransform';

import {
    WithId,
} from '#utils/common';

import {
    ClientQuery,
    ClientQueryVariables,
    CreateClientMutation,
    CreateClientMutationVariables,
    UpdateClientMutation,
    UpdateClientMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const GET_CLIENT = gql`
    query Client($id: ID!) {
        client(id: $id) {
            id
            code
            name
            isActive
            createdBy {
                id
                fullName
            }
        }
    }
`;

const CREATE_CLIENT = gql`
    mutation CreateClient($clientRecordItem: clientCreateInputType!) {
        createClient(data: $clientRecordItem) {
            result {
                id
                code
                isActive
                name
                createdBy {
                    id
                    fullName
                    isActive
                    isAdmin
                }
            }
            errors
            ok
        }
    }
`;

const UPDATE_CLIENT = gql`
    mutation UpdateClient($clientRecordItem: ClientUpdateInputType!) {
        updateClient(data: $clientRecordItem) {
            result {
                id
                code
                isActive
                name
                createdBy {
                    id
                    fullName
                    isActive
                    isAdmin
                }
            }
            errors
            ok
        }
    }
`;

type ClientRecordFormFields = CreateClientMutationVariables['clientRecordItem'];
type FormType = PurgeNull<PartialForm<WithId<ClientRecordFormFields>>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        name: [requiredCondition],
        code: [requiredStringCondition],
        isActive: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    code: undefined,
    name: undefined,
    isActive: undefined,
};

interface ClientRecordProps {
    className?: string;
    id: string | undefined;
    onClientCreate?: (result: NonNullable<NonNullable<CreateClientMutation['createClient']>['result']>) => void;
    readOnly?: boolean;
    onClientCreateCancel: () => void;
}

function ClientRecordForm(props: ClientRecordProps) {
    const {
        onClientCreate,
        id,
        readOnly,
        className,
        onClientCreateCancel,
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

    const clientVariables = useMemo(
        (): ClientQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: clientDataLoading,
        error: clientDataError,
    } = useQuery<ClientQuery>(
        GET_CLIENT,
        {
            skip: !clientVariables,
            variables: clientVariables,
            onCompleted: (response) => {
                const { client } = response;
                if (!client) {
                    return;
                }
                onValueSet(removeNull({
                    ...client,
                    id: client.id,
                    name: client.name,
                    code: client.code,
                    isActive: client.isActive,
                }));
            },
        },
    );

    const [
        createClientRecord,
        { loading: createLoading },
    ] = useMutation<CreateClientMutation, CreateClientMutationVariables>(
        CREATE_CLIENT,
        {
            onCompleted: (response) => {
                const {
                    createClient: createClientRes,
                } = response;
                if (!createClientRes) {
                    return;
                }
                const { errors, result } = createClientRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onClientCreate && result) {
                    notify({
                        children: 'Client created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onClientCreate(result);
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

    const [
        updateClientRecord,
        { loading: updateLoading },
    ] = useMutation<UpdateClientMutation, UpdateClientMutationVariables>(
        UPDATE_CLIENT,
        {
            onCompleted: (response) => {
                const {
                    updateClient: updateClientRes,
                } = response;
                if (!updateClientRes) {
                    return;
                }
                const { errors, result } = updateClientRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onClientCreate && result) {
                    notify({
                        children: 'Client updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onClientCreate(result);
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

    const handleSubmit = useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateClientRecord({
                variables: {
                    clientRecordItem: finalValues as WithId<ClientRecordFormFields>,
                },
            });
        } else {
            createClientRecord({
                variables: {
                    clientRecordItem: finalValues as ClientRecordFormFields,
                },
            });
        }
    }, [
        createClientRecord,
        updateClientRecord,
    ]);

    const loading = createLoading || updateLoading || clientDataLoading;
    const errored = !!clientDataError;
    const disabled = loading || errored;

    return (
        <form
            className={_cs(className, styles.clientRecordsForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Client Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                readOnly={readOnly}
                autoFocus
                disabled={disabled}
            />
            <TextInput
                label="Client Code *"
                name="code"
                value={value.code}
                onChange={onValueChange}
                error={error?.fields?.code}
                readOnly={readOnly}
                autoFocus
                disabled={disabled}
            />
            <BooleanInput
                label="Active"
                name="isActive"
                value={value.isActive}
                onChange={onValueChange}
                error={error?.fields?.isActive}
            />
            {!readOnly && (
                <div className={styles.formButtons}>
                    {!!onClientCreateCancel && (
                        <Button
                            name={undefined}
                            onClick={onClientCreateCancel}
                            disabled={disabled}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        name={undefined}
                        disabled={disabled || pristine}
                        variant="primary"
                    >
                        Submit
                    </Button>
                </div>
            )}
        </form>
    );
}

export default ClientRecordForm;
