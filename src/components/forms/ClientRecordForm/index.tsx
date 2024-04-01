import React, { useContext, useCallback, useMemo } from 'react';
import { isDefined, _cs } from '@togglecorp/fujs';
import {
    TextInput,
    Button,
    Switch,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    PartialForm,
    PurgeNull,
    emailCondition,
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
    enumKeySelector,
    enumLabelSelector,
    GetEnumOptions,
    WithId,
} from '#utils/common';

import {
    ClientOptionsQuery,
    ClientOptionsQueryVariables,
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
            acronym
            code
            contactEmail
            contactName
            contactWebsite
            createdAt
            createdBy {
                id
                fullName
            }
            id
            isActive
            name
            useCase
            optedOutOfEmails
        }
    }
`;

const CREATE_CLIENT = gql`
    mutation CreateClient($clientRecordItem: ClientCreateInputType!) {
        createClient(data: $clientRecordItem) {
            result {
                acronym
                code
                contactEmail
                contactName
                contactWebsite
                createdAt
                id
                isActive
                name
                optedOutOfEmails
                otherNotes
                useCase
                createdBy {
                    id
                    fullName
                    isActive
                    portfoliosMetadata {
                        isAdmin
                    }
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
                acronym
                code
                contactEmail
                contactName
                contactWebsite
                createdAt
                id
                isActive
                name
                optedOutOfEmails
                otherNotes
                useCase
                createdBy {
                    id
                    fullName
                    isActive
                    portfoliosMetadata {
                        isAdmin
                    }
                }
            }
            errors
            ok
        }
    }
`;

const CLIENT_OPTIONS = gql`
    query ClientOptions {
        useCaseType: __type(name: "USE_CASE_CHOICES") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

type ClientRecordFormFields = CreateClientMutationVariables['clientRecordItem'];
type FormType = PurgeNull<PartialForm<WithId<ClientRecordFormFields>>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        acronym: [],
        name: [requiredCondition],
        contactName: [requiredCondition],
        contactEmail: [requiredCondition, emailCondition],
        contactWebsite: [],
        isActive: [requiredCondition],
        useCase: [],
        optedOutOfEmails: [requiredCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

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
        data,
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
                onValueSet(removeNull(client));
            },
        },
    );

    const {
        data: clientOptions,
        loading: clientOptionsLoading,
        error: clientOptionsError,
    } = useQuery<ClientOptionsQuery, ClientOptionsQueryVariables>(CLIENT_OPTIONS);

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

    const useCaseTypes = clientOptions?.useCaseType?.enumValues;
    type UseCaseTypeOptions = GetEnumOptions<
        typeof useCaseTypes,
        NonNullable<typeof value.useCase>[number]
    >;

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
            {isDefined(data?.client?.code) && (
                <TextInput
                    label="Code"
                    name="code"
                    value={data?.client?.code}
                    readOnly
                    autoFocus
                />
            )}
            <TextInput
                label="Acronym"
                name="acronym"
                value={value.acronym}
                onChange={onValueChange}
                error={error?.fields?.acronym}
                readOnly={readOnly}
                autoFocus
                disabled={disabled}
            />
            <TextInput
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                readOnly={readOnly}
                autoFocus
                disabled={disabled}
            />
            <TextInput
                label="Contact Name *"
                name="contactName"
                value={value.contactName}
                onChange={onValueChange}
                error={error?.fields?.contactName}
                readOnly={readOnly}
                autoFocus
                disabled={disabled}
            />
            <TextInput
                label="Contact Email *"
                name="contactEmail"
                value={value.contactEmail}
                onChange={onValueChange}
                error={error?.fields?.contactEmail}
                readOnly={readOnly}
                autoFocus
                disabled={disabled}
            />
            <TextInput
                label="Website"
                name="contactWebsite"
                value={value.contactWebsite}
                onChange={onValueChange}
                error={error?.fields?.contactWebsite}
                readOnly={readOnly}
                autoFocus
                disabled={disabled}
            />
            <BooleanInput
                label="Active *"
                name="isActive"
                value={value.isActive}
                onChange={onValueChange}
                error={error?.fields?.isActive}
            />
            <MultiSelectInput
                label="useCase"
                name="useCase"
                options={useCaseTypes as UseCaseTypeOptions}
                value={value.useCase}
                onChange={onValueChange}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                error={error?.fields?.useCase?.$internal}
                disabled={clientOptionsLoading || !!clientOptionsError}
            />
            <Switch
                name="optedOutOfEmails"
                label="Opted-out of receiving emails"
                value={value.optedOutOfEmails}
                onChange={onValueChange}
                error={error?.fields?.optedOutOfEmails}
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
