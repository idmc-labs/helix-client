import React, { useCallback, useContext } from 'react';
import {
    Button,
    SelectInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { requiredCondition } from '#utils/validation';

import {
    BasicEntity,
    PartialForm,
    PurgeNull,
} from '#types';
import {
    UserRoleQuery,
    RolesListQuery,
    UpdateUserRoleMutation,
    UpdateUserRoleMutationVariables,
} from '#generated/types';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

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

// TODO: find user role by id ( not email )
// Update in backend required
const USER_ROLE = gql`
    query UserRole($email: String) {
        users(email: $email) {
            results {
                id
                role
            }
        }
    }
`;

const UPDATE_USER_ROLE = gql`
    mutation UpdateUserRole($id: ID!, $role: USER_ROLE) {
        updateUser(data: {id: $id, role: $role}) {
            result {
                dateJoined
                isActive
                id
                fullName
                username
                role
                email
            }
            errors {
                field
                messages
            }
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & {id: string };
type FormType = PurgeNull<PartialForm<Omit<UpdateUserRoleMutationVariables, 'role'> & {role:BasicEntity['id']}>>;

const schema: Schema<FormType> = {
    fields: () => ({
        id: [requiredCondition],
        role: [requiredCondition],
    }),
};

interface UserRoleFormProps {
    email: string | undefined;
    onUserRoleFormClose: () => void;
}

const defaultFormValues: PartialForm<FormType> = {};

function UserRoleForm(props:UserRoleFormProps) {
    const {
        onUserRoleFormClose,
        email,
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
        loading: userRoleLoading,
        error: userRoleError,
    } = useQuery<UserRoleQuery>(
        USER_ROLE,
        {
            skip: !email,
            variables: email ? { email } : undefined,
            onCompleted: (response) => {
                const { users } = response;

                if (!users) {
                    return;
                }
                const { results } = users;
                if (!results) {
                    return;
                }
                // NOTE: results is an array with only one object
                onValueSet(removeNull({
                    role: results[0].role,
                    id: results[0].id,
                }));
            },
        },
    );

    const {
        data: rolesOptions,
    } = useQuery<RolesListQuery>(GET_ROLES_LIST);

    const rolesList = rolesOptions?.roleList?.enumValues;

    const [
        updateUserRole,
        { loading: updateLoading },
    ] = useMutation<UpdateUserRoleMutation, UpdateUserRoleMutationVariables>(
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
                    notify({ children: 'User Role updated successfully!' });
                    onPristineSet(true);
                    onUserRoleFormClose();
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
            updateUserRole({
                variables: finalValues as WithId<UpdateUserRoleMutationVariables>,
            });
        }, [updateUserRole],
    );

    const loading = userRoleLoading || updateLoading;
    const errored = !!userRoleError;
    const disabled = loading || errored;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.row}>
                <SelectInput
                    label="Role *"
                    name="role"
                    options={rolesList}
                    value={value.role}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.role}
                    disabled={disabled}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onUserRoleFormClose}
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

export default UserRoleForm;
