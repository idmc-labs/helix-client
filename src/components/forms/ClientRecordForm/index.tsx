import React, { useContext, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TextInput,
    SelectInput,
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
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import { transformToFormError } from '#utils/errorTransform';

import {
    WithId,
} from '#utils/common';

import {
    CreateClientMutation,
    CreateClientMutationVariables,
    UpdateClientMutation,
    UpdateClientMutationVariables,
} from '#generated/types';
import styles from './styles.css';

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

interface ActiveOption {
    key: boolean;
    label: string;
}
const isActiveOptions: ActiveOption[] = [
    { key: true, label: 'Yes' },
    { key: false, label: 'No' },
];
const keySelector = (item: ActiveOption) => item.key;
const labelSelector = (item: ActiveOption) => item.label;

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

interface ClientRecordProps {
    className?: string;
    id?: string;
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

    console.log('Check the ID of particular record::>>', id);

    const defaultFormValues: PartialForm<FormType> = {
        code: undefined,
        name: undefined,
        isActive: undefined,
    };

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
                        children: 'New Client record created successfully!',
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
                        children: 'Client record updated successfully!',
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

    const loading = createLoading || updateLoading;
    const disabled = loading;

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
            <SelectInput
                className={styles.input}
                label="Active"
                name="isActive"
                options={isActiveOptions}
                value={value.isActive}
                keySelector={keySelector}
                labelSelector={labelSelector}
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
