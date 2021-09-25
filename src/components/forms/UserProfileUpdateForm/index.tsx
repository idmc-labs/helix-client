import React, { useCallback, useContext, useMemo } from 'react';
import {
    Button,
    TextInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredStringCondition,
    idCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import Row from '#components/Row';
import { transformToFormError } from '#utils/errorTransform';

import {
    UserProfileQuery,
    UserProfileQueryVariables,
    UpdateUserProfileMutation,
    UpdateUserProfileMutationVariables,
} from '#generated/types';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import styles from './styles.css';

const GET_USER = gql`
    query UserProfile($id: ID!) {
        user(id: $id) {
            id
            firstName
            lastName
        }
    }
`;

const UPDATE_USER = gql`
    mutation UpdateUserProfile($data: UserUpdateInputType!) {
        updateUser(data: $data) {
            result {
                id
                firstName
                lastName
                fullName
            }
            errors
        }
    }
`;

type UserFormFields = UpdateUserProfileMutationVariables['data'];
type FormType = PurgeNull<PartialForm<UserFormFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        firstName: [requiredStringCondition],
        lastName: [requiredStringCondition],
    }),
};

interface UserFormProps {
    userId: string;
    onFormCancel: () => void;
    onFormSave: (user: NonNullable<NonNullable<UpdateUserProfileMutation['updateUser']>['result']>) => void;
}

const defaultFormValues: PartialForm<FormType> = {};

function UserForm(props: UserFormProps) {
    const {
        onFormCancel,
        onFormSave,
        userId,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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

    const profileVariables = useMemo(
        (): UserProfileQueryVariables | undefined => (
            userId ? { id: userId } : undefined
        ),
        [userId],
    );

    const {
        loading: userLoading,
        error: userError,
    } = useQuery<UserProfileQuery>(
        GET_USER,
        {
            variables: profileVariables,
            onCompleted: (response) => {
                const { user } = response;
                if (!user) {
                    return;
                }

                onValueSet(removeNull(user));
            },
        },
    );

    const [
        updateUser,
        { loading: updateLoading },
    ] = useMutation<UpdateUserProfileMutation, UpdateUserProfileMutationVariables>(
        UPDATE_USER,
        {
            onCompleted: (response) => {
                const { updateUser: updateUserRes } = response;
                if (!updateUserRes) {
                    return;
                }
                const { errors, result } = updateUserRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'User updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onFormSave(result);
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

    const handleSubmit = useCallback(
        (finalValues: PartialForm<FormType>) => {
            const variables = {
                data: finalValues,
            } as UpdateUserProfileMutationVariables;
            updateUser({
                variables,
            });
        }, [updateUser],
    );

    const loading = userLoading || updateLoading;
    const errored = !!userError;
    const disabled = loading || errored;

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
                    label="First Name *"
                    name="firstName"
                    value={value.firstName}
                    onChange={onValueChange}
                    error={error?.fields?.firstName}
                    disabled={disabled}
                />
                <TextInput
                    label="Last Name *"
                    name="lastName"
                    value={value.lastName}
                    onChange={onValueChange}
                    error={error?.fields?.lastName}
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
                    className={styles.button}
                    variant="primary"
                    disabled={disabled || pristine}
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default UserForm;
