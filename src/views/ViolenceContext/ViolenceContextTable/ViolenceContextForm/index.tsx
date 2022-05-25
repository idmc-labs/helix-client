import React, { useContext, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TextInput,
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
    idCondition,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import { EnumFix, WithId } from '#utils/common';

import { transformToFormError } from '#utils/errorTransform';

import {
    ContextOfViolenceQuery,
    ContextOfViolenceQueryVariables,
    CreateViolenceContextMutation,
    CreateViolenceContextMutationVariables,
    UpdateViolenceContextMutation,
    UpdateViolenceContextMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const VIOLENCE_CONTEXT = gql`
    query ContextOfViolence($id: ID!) {
        contextOfViolence(id: $id) {
            id
            name
        }
    }
`;

const CREATE_VIOLENCE_CONTEXT = gql`
    mutation CreateViolenceContext($data: ContextOfViolenceCreateInputType!) {
        createContextOfViolence(data: $data) {
            result {
                id
                name
            }
            errors
        }
    }
`;

const UPDATE_VIOLENCE_CONTEXT = gql`
    mutation UpdateViolenceContext($data: ContextOfViolenceUpdateInputType!) {
        updateContextOfViolence(data: $data) {
            result {
                id
                name
            }
            errors
        }
    }
`;

type ViolenceContextFormFields = CreateViolenceContextMutationVariables['data'];
type FormType = PurgeNull<PartialForm<WithId<EnumFix<ViolenceContextFormFields, 'status'>>>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        name: [requiredCondition],
    }),
};

interface ViolenceContextFormProps {
    className?: string;
    onCreate?: (result: NonNullable<NonNullable<CreateViolenceContextMutation['createContextOfViolence']>['result']>) => void;
    id?: string;
    onFormCancel: () => void;
}

function ViolenceContextForm(props: ViolenceContextFormProps) {
    const {
        onCreate,
        id,
        className,
        onFormCancel,
    } = props;

    const defaultFormValues: PartialForm<FormType> = {};

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

    const violenceContextVariables = useMemo(
        (): ContextOfViolenceQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: violenceContextDataLoading,
        error: violenceContextDataError,
    } = useQuery<ContextOfViolenceQuery, ContextOfViolenceQueryVariables>(
        VIOLENCE_CONTEXT,
        {
            skip: !violenceContextVariables,
            variables: violenceContextVariables,
            onCompleted: (response) => {
                const { contextOfViolence } = response;
                if (!contextOfViolence) {
                    return;
                }

                onValueSet(removeNull({
                    ...contextOfViolence,
                }));
            },
        },
    );

    const [
        createContextOfViolence,
        { loading: createLoading },
    ] = useMutation<CreateViolenceContextMutation, CreateViolenceContextMutationVariables>(
        CREATE_VIOLENCE_CONTEXT,
        {
            onCompleted: (response) => {
                const {
                    createContextOfViolence: createViolenceContextRes,
                } = response;
                if (!createViolenceContextRes) {
                    return;
                }
                const { errors, result } = createViolenceContextRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onCreate && result) {
                    notify({
                        children: 'Context of Violence created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onCreate(result);
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
        updateContextOfViolence,
        { loading: updateLoading },
    ] = useMutation<UpdateViolenceContextMutation, UpdateViolenceContextMutationVariables>(
        UPDATE_VIOLENCE_CONTEXT,
        {
            onCompleted: (response) => {
                const {
                    updateContextOfViolence: updateViolenceContextRes,
                } = response;
                if (!updateViolenceContextRes) {
                    return;
                }
                const { errors, result } = updateViolenceContextRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onCreate && result) {
                    notify({
                        children: 'Context of Violence updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onCreate(result);
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

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateContextOfViolence({
                variables: {
                    data: finalValues as WithId<ViolenceContextFormFields>,
                },
            });
        } else {
            createContextOfViolence({
                variables: {
                    data: finalValues as ViolenceContextFormFields,
                },
            });
        }
    }, [
        createContextOfViolence,
        updateContextOfViolence,
    ]);

    const loading = createLoading || updateLoading || violenceContextDataLoading;
    const errored = !!violenceContextDataError;
    const disabled = loading || errored;

    return (
        <form
            className={_cs(className, styles.violenceContextForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <TextInput
                    label="Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                />
            </Row>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onFormCancel}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                    className={styles.button}
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default ViolenceContextForm;
