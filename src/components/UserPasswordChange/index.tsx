import React, { useCallback, useContext } from 'react';
import {
    Button,
    PasswordInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
} from '@apollo/client';

import Row from '#components/Row';
import useForm, { createSubmitHandler } from '#utils/form';
import type { ObjectSchema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { requiredStringCondition } from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';
import {
    UserChangePasswordMutation,
    UserChangePasswordMutationVariables,
} from '#generated/types';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import styles from './styles.css';

const USER_CHANGE_PASSWORD = gql`
    mutation UserChangePassword($data: UserPasswordInputType!) {
        changePassword(data: $data) {
            errors
            result {
              id
            }
        }
    }
`;

type UserFormFields = UserChangePasswordMutationVariables['data'];
type FormType = PurgeNull<PartialForm<
    UserFormFields & { oldPassword: string, newPassword: string, passwordConfirmation: string }
>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    validation: (value) => {
        if (
            value.newPassword
            && value.passwordConfirmation
            && value.newPassword !== value.passwordConfirmation
        ) {
            return 'The passwords do not match.';
        }
        return undefined;
    },
    fields: (): FormSchemaFields => ({
        oldPassword: [requiredStringCondition],
        newPassword: [requiredStringCondition],
        passwordConfirmation: [requiredStringCondition],
    }),
};

interface UserFormProps {
    onUserFormClose: () => void;
}

const defaultFormValues: PartialForm<FormType> = {};

function UserForm(props: UserFormProps) {
    const {
        onUserFormClose,
    } = props;

    const { notify } = useContext(NotificationContext);

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const [
        updateUser,
        { loading: updateLoading },
    ] = useMutation<UserChangePasswordMutation, UserChangePasswordMutationVariables>(
        USER_CHANGE_PASSWORD,
        {
            onCompleted: (response) => {
                const { changePassword: changePasswordRes } = response;
                if (!changePasswordRes) {
                    return;
                }
                const { errors, result } = changePasswordRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to update user password.' });
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'User password updated successfully!' });
                    onPristineSet(true);
                    onUserFormClose();
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update user password.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback(
        (finalValues: PartialForm<FormType>) => {
            const variables = {
                data: {
                    oldPassword: finalValues.oldPassword,
                    newPassword: finalValues.newPassword,
                },
            } as UserChangePasswordMutationVariables;

            updateUser({
                variables,
            });
        }, [updateUser],
    );

    const loading = updateLoading;
    const disabled = loading;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row className={styles.twoColumnRow}>
                <PasswordInput
                    label="Old Password *"
                    name="oldPassword"
                    value={value.oldPassword}
                    onChange={onValueChange}
                    error={error?.fields?.oldPassword}
                    disabled={disabled}
                />
            </Row>
            <Row className={styles.twoColumnRow}>
                <PasswordInput
                    label="New Password *"
                    name="newPassword"
                    value={value.newPassword}
                    onChange={onValueChange}
                    error={error?.fields?.newPassword}
                    disabled={disabled}
                />
                <PasswordInput
                    label="Re-enter Password *"
                    name="passwordConfirmation"
                    value={value.passwordConfirmation}
                    onChange={onValueChange}
                    error={error?.fields?.passwordConfirmation}
                    disabled={disabled}
                />
            </Row>
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
