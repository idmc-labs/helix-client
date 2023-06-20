import React, { useContext, useMemo, useState } from 'react';
import { _cs, isTruthyString } from '@togglecorp/fujs';
import { TextInput, Button, Switch } from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    idCondition,
    PartialForm,
    PurgeNull,
    emailCondition,
    requiredStringCondition,
} from '@togglecorp/toggle-form';

import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import NonFieldError from '#components/NonFieldError';

import {
    WithId,
} from '#utils/common';
import { transformToFormError } from '#utils/errorTransform';
import {
    UpdateUserMutation,
    UpdateUserMutationVariables,
    UserEmailInfoQuery,
    UserEmailInfoQueryVariables,
} from '#generated/types';
import styles from './styles.css';

const USER_EMAIL_INFO = gql`
    query UserEmailInfo($id: ID!) {
        user(id: $id) {
            id
            firstName
            lastName
            fullName
        }
    }
`;

const UPDATE_USER_EMAIL = gql`
    mutation UpdateUser($userItem: UserUpdateInputType!) {
        updateUser(data: $userItem) {
            errors
            result {
                id
                lastName
                firstName
                fullName
            }
        }
    }
`;

type EmailChangeFormFields = UpdateUserMutationVariables['userItem'];
type FormType = PurgeNull<PartialForm<WithId<EmailChangeFormFields>>> & { confirmEmail?: string };

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    validation: (value) => {
        if (
            isTruthyString(value?.email)
                && isTruthyString(value?.confirmEmail)
                && value?.email !== value?.confirmEmail
        ) {
            return 'The passwords do no match';
        }
        return undefined;
    },
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        email: [emailCondition, requiredStringCondition],
        confirmEmail: [emailCondition, requiredStringCondition],
        firstName: [requiredStringCondition],
        lastName: [requiredStringCondition],
    }),
};

const schemaWithoutEmail: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        firstName: [requiredStringCondition],
        lastName: [requiredStringCondition],
    }),
};

interface EmailChangeProps {
    className?: string;
    id?: string;
    onEmailChangeFormCancel?: () => void;
}

function UserEmailChangeForm(props: EmailChangeProps) {
    const {
        className,
        id,
        onEmailChangeFormCancel,
    } = props;

    const [emailUpdate, setEmailUpdate] = useState<boolean>(false);

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
    } = useForm(defaultFormValues, emailUpdate ? schema : schemaWithoutEmail);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const userVariables = useMemo(
        (): UserEmailInfoQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: userEmailDataLoading,
        error: userEmailDataError,
    } = useQuery<UserEmailInfoQuery, UserEmailInfoQueryVariables>(
        USER_EMAIL_INFO,
        {
            skip: !userVariables,
            variables: userVariables,
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
    ] = useMutation<UpdateUserMutation, UpdateUserMutationVariables>(
        UPDATE_USER_EMAIL,
        {
            onCompleted: (response) => {
                const {
                    updateUser: updateUserRes,
                } = response;
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
        const sanitizedValues = { ...finalValues };
        delete sanitizedValues.confirmEmail;

        updateUser({
            variables: {
                userItem: sanitizedValues as WithId<EmailChangeFormFields>,
            },
        });
    }, [updateUser]);

    const loading = updateLoading || userEmailDataLoading;
    const disabled = loading || !!userEmailDataError;

    return (
        <form
            className={_cs(className, styles.emailChange)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="First Name *"
                name="firstName"
                value={value.firstName}
                onChange={onValueChange}
                error={error?.fields?.firstName}
                autoFocus
                disabled={disabled}
            />
            <TextInput
                label="Last Name"
                name="lastName"
                value={value.lastName}
                onChange={onValueChange}
                error={error?.fields?.lastName}
                disabled={disabled}
            />
            <Switch
                name=""
                label="Update user email"
                value={emailUpdate}
                onChange={setEmailUpdate}
            />
            {emailUpdate && (
                <>
                    <TextInput
                        label="Email"
                        name="email"
                        value={value.email}
                        onChange={onValueChange}
                        error={error?.fields?.email}
                        disabled={disabled}
                    />
                    <TextInput
                        label="Confirm Email"
                        name="confirmEmail"
                        value={value.confirmEmail}
                        onChange={onValueChange}
                        error={error?.fields?.confirmEmail}
                        disabled={disabled}
                    />
                </>
            )}
            <div className={styles.formButtons}>
                {!!onEmailChangeFormCancel && (
                    <Button
                        name={undefined}
                        onClick={onEmailChangeFormCancel}
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
        </form>
    );
}

export default UserEmailChangeForm;
