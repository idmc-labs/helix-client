import React, { useCallback, useContext } from 'react';
import {
    Button,
    SelectInput,
    TextInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { ObjectSchema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { idCondition, requiredCondition } from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';
import {
    UserQuery,
    RolesListQuery,
    UpdateUserMutation,
    UpdateUserMutationVariables,
} from '#generated/types';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import styles from './styles.css';

const GET_ROLES_LIST = gql`
    query RolesList {
        roleList: __type(name: "USER_ROLE") {
            enumValues {
                name
                description
            }
        }
    }
`;

const USER = gql`
    query User($id: ID!) {
        user(id: $id) {
            id
            fullName
            username
            firstName
            lastName
            role
        }
    }
`;

const UPDATE_USER_ROLE = gql`
    mutation UpdateUser($data: UserUpdateInputType!) {
        updateUser(data: $data) {
            result {
                id
                fullName
                username
                firstName
                lastName
                role
            }
            errors {
                field
                messages
            }
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type UserFormFields = UpdateUserMutationVariables['data'];
type FormType = PurgeNull<PartialForm<Omit<UserFormFields, 'role'> & { role: string }>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        username: [requiredCondition],
        firstName: [requiredCondition],
        lastName: [requiredCondition],
        role: [requiredCondition],
    }),
};

interface UserFormProps {
    userId: string;
    onUserFormClose: () => void;
}

const defaultFormValues: PartialForm<FormType> = {};

function UserForm(props:UserFormProps) {
    const {
        onUserFormClose,
        userId,
    } = props;

    const { notify } = useContext(NotificationContext);

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
        loading: userLoading,
        error: userError,
    } = useQuery<UserQuery>(
        USER,
        {
            skip: !userId,
            variables: userId ? { id: userId } : undefined,
            onCompleted: (response) => {
                const { user } = response;
                if (!user) {
                    return;
                }

                onValueSet(removeNull(user));
            },
        },
    );

    const {
        data: rolesOptions,
        loading: rolesOptionsLoading,
        error: rolesOptionsError,
    } = useQuery<RolesListQuery>(GET_ROLES_LIST);

    const [
        updateUser,
        { loading: updateLoading },
    ] = useMutation<UpdateUserMutation, UpdateUserMutationVariables>(
        UPDATE_USER_ROLE,
        {
            onCompleted: (response) => {
                const { updateUser: updateUserRes } = response;
                if (!updateUserRes) {
                    return;
                }
                const { errors, result } = updateUserRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'User updated successfully!' });
                    onPristineSet(true);
                    onUserFormClose();
                }
            },
            onError: (errors) => {
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
            } as UpdateUserMutationVariables;
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
            {loading && <Loading absolute /> }
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.row}>
                <TextInput
                    label="Username *"
                    name="username"
                    value={value.username}
                    onChange={onValueChange}
                    error={error?.fields?.username}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="First Name*"
                    name="firstName"
                    value={value.firstName}
                    onChange={onValueChange}
                    error={error?.fields?.firstName}
                    disabled={disabled}
                />
                <TextInput
                    label="Last Name*"
                    name="lastName"
                    value={value.lastName}
                    onChange={onValueChange}
                    error={error?.fields?.lastName}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <SelectInput
                    label="Role *"
                    name="role"
                    options={rolesOptions?.roleList?.enumValues}
                    value={value.role}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.role}
                    disabled={disabled || rolesOptionsLoading || !!rolesOptionsError}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onUserFormClose}
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
