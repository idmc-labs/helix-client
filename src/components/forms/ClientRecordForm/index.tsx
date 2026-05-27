import React, { useContext, useCallback, useMemo, useState } from 'react';
import { isDefined, _cs } from '@togglecorp/fujs';
import {
    Button,
    MultiSelectInput,
    SelectInput,
    Switch,
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';
import {
    idCondition,
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    requiredListCondition,
    requiredStringCondition,
    PartialForm,
    PurgeNull,
    emailCondition,
    nullCondition,
    arrayCondition,
} from '@togglecorp/toggle-form';
import { IoCopyOutline } from 'react-icons/io5';

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
    urlConditionWithProtocolCheck,
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
    // eslint-disable-next-line camelcase
    Client_Type,
} from '#generated/types';
import styles from './styles.module.css';

const GET_CLIENT = gql`
    query Client($id: ID!) {
        client(id: $id) {
            id
            acronym
            code
            contactEmail
            contactName
            contactWebsite
            createdBy {
                id
                fullName
            }
            type
            typeDisplay
            isActive
            name
            description
            shareSource
            useCases
            optedOutOfEmails
            otherNotes
        }
    }
`;

const CREATE_CLIENT = gql`
    mutation CreateClient($clientRecordItem: ClientCreateInputType!) {
        createClient(data: $clientRecordItem) {
            result {
                id
                acronym
                code
                contactEmail
                contactName
                contactWebsite
                isActive
                name
                description
                shareSource
                optedOutOfEmails
                otherNotes
                useCases
                type
                typeDisplay
                createdAt
                createdBy {
                    id
                    fullName
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
                id
                isActive
                name
                description
                shareSource
                optedOutOfEmails
                otherNotes
                useCases
                type
                typeDisplay
                createdAt
                createdBy {
                    id
                    fullName
                }
            }
            errors
            ok
        }
    }
`;

const CLIENT_OPTIONS = gql`
    query ClientOptions {
        useCaseTypes: __type(name: "USE_CASE_TYPES") {
            name
            enumValues {
                name
                description
            }
        }
        clientType: __type(name: "CLIENT_TYPE") {
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
    fields: (val): FormSchemaFields => {
        const baseSchema: FormSchemaFields = ({
            id: [idCondition],
            acronym: [],
            description: [],
            name: [requiredStringCondition],
            contactName: [requiredStringCondition],
            contactEmail: [requiredStringCondition, emailCondition],
            contactWebsite: [urlConditionWithProtocolCheck],
            isActive: [requiredCondition],
            shareSource: [requiredCondition],
            useCases: [arrayCondition, requiredListCondition],
            optedOutOfEmails: [requiredCondition],
            type: [requiredCondition],
        });

        if (val?.useCases?.includes('OTHER')) {
            return {
                ...baseSchema,
                otherNotes: [requiredStringCondition],
            };
        }
        return {
            ...baseSchema,
            otherNotes: [nullCondition],
        };
    },
};

const defaultFormValues: PartialForm<FormType> = {
    isActive: false,
    shareSource: false,
    optedOutOfEmails: false,
};

// eslint-disable-next-line camelcase
const clientTypeKeySelector = (option: { name: string }) => option.name as Client_Type;

interface ClientRecordProps {
    className?: string;
    id: string | undefined;
    refetchClientLists: () => void;
    onCancel: () => void;
}

function ClientRecordForm(props: ClientRecordProps) {
    const {
        refetchClientLists,
        id,
        className,
        onCancel,
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

    const [readOnly, setReadOnly] = useState<boolean>(false);
    const [clientCode, setClientCode] = useState<string | undefined>(undefined);

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
                setClientCode(client.code);
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
                const { result, errors } = removeNull(response.createClient);

                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Client created successfully!',
                        variant: 'success',
                    });
                    onValueSet(removeNull(result));
                    setClientCode(result.code);
                    setReadOnly(true);
                    refetchClientLists();
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
                const { result, errors } = removeNull(response.updateClient);

                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Client updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    setReadOnly(false);
                    onCancel();
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

    const useCaseTypes = clientOptions?.useCaseTypes?.enumValues;
    type UseCaseTypeOptions = GetEnumOptions<
        typeof useCaseTypes,
        NonNullable<typeof value.useCases>[number]
    >;
    const clientTypes = clientOptions?.clientType?.enumValues;
    type ClientTypeOptions = GetEnumOptions<
        typeof useCaseTypes,
        NonNullable<typeof value.type>[number]
    >;

    const handleCopy = useCallback(
        () => {
            if (isDefined(clientCode)) {
                navigator.clipboard.writeText(clientCode);
                notify({
                    children: 'Code copied to clipboard!',
                    variant: 'success',
                });
            }
        }, [
            clientCode,
            notify,
        ],
    );

    const handleCopyAndClose = useCallback(
        () => {
            if (isDefined(clientCode)) {
                navigator.clipboard.writeText(clientCode);
                notify({
                    children: 'Code copied to clipboard!',
                    variant: 'success',
                });
                onCancel();
            }
        }, [
            clientCode,
            notify,
            onCancel,
        ],
    );

    const visibleNotes = new Set(value.useCases).has('OTHER');
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
                disabled={disabled}
            />
            <TextArea
                label="Description"
                name="description"
                value={value.description}
                onChange={onValueChange}
                disabled={disabled}
                error={error?.fields?.description}
                readOnly={readOnly}
            />
            <TextInput
                label="Contact Name *"
                name="contactName"
                value={value.contactName}
                onChange={onValueChange}
                error={error?.fields?.contactName}
                readOnly={readOnly}
                disabled={disabled}
            />
            <TextInput
                label="Contact Email *"
                name="contactEmail"
                value={value.contactEmail}
                onChange={onValueChange}
                error={error?.fields?.contactEmail}
                readOnly={readOnly}
                disabled={disabled}
            />
            <TextInput
                label="Website"
                name="contactWebsite"
                value={value.contactWebsite}
                onChange={onValueChange}
                error={error?.fields?.contactWebsite}
                readOnly={readOnly}
                disabled={disabled}
            />
            <BooleanInput
                label="Active *"
                name="isActive"
                value={value.isActive}
                onChange={onValueChange}
                error={error?.fields?.isActive}
                readOnly={readOnly}
            />
            <MultiSelectInput
                label="Use Cases *"
                name="useCases"
                options={useCaseTypes as UseCaseTypeOptions}
                value={value.useCases}
                onChange={onValueChange}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                error={error?.fields?.useCases?.$internal}
                disabled={clientOptionsLoading || !!clientOptionsError}
                readOnly={readOnly}
            />
            <SelectInput
                label="Type *"
                name="type"
                options={clientTypes as ClientTypeOptions}
                value={value.type}
                onChange={onValueChange}
                keySelector={clientTypeKeySelector}
                labelSelector={enumLabelSelector}
                error={error?.fields?.type}
                disabled={clientOptionsLoading || !!clientOptionsError}
                readOnly={readOnly}
            />
            <BooleanInput
                label="Share source *"
                name="shareSource"
                value={value.shareSource}
                onChange={onValueChange}
                error={error?.fields?.shareSource}
                readOnly={readOnly}
            />
            {visibleNotes && (
                <TextInput
                    label="Notes *"
                    name="otherNotes"
                    value={value.otherNotes}
                    onChange={onValueChange}
                    error={error?.fields?.otherNotes}
                    readOnly={readOnly}
                    disabled={disabled}
                />
            )}
            <Switch
                name="optedOutOfEmails"
                label="Opted-out of receiving emails"
                value={value.optedOutOfEmails}
                onChange={onValueChange}
                error={error?.fields?.optedOutOfEmails}
                readOnly={readOnly}
            />
            {isDefined(clientCode) && (
                <TextInput
                    label="Code"
                    name="code"
                    value={clientCode}
                    readOnly
                    autoFocus
                    actions={(
                        <Button
                            compact
                            transparent
                            name={undefined}
                            title="Copy code"
                            onClick={handleCopy}
                        >
                            <IoCopyOutline />
                        </Button>
                    )}
                />
            )}
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onCancel}
                    disabled={disabled}
                >
                    {readOnly ? 'Close' : 'Cancel' }
                </Button>
                {!readOnly && (
                    <Button
                        type="submit"
                        name={undefined}
                        disabled={disabled || pristine}
                        variant="primary"
                    >
                        Submit
                    </Button>
                )}
                {readOnly && (
                    <Button
                        name={undefined}
                        onClick={handleCopyAndClose}
                        disabled={disabled}
                        variant="primary"
                    >
                        Copy code and close
                    </Button>
                )}
            </div>
        </form>
    );
}

export default ClientRecordForm;
