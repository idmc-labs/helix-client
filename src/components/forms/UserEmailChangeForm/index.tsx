import React, { useContext, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    idCondition,
    PartialForm,
    PurgeNull,
    emailCondition,
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
            email
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
                isActive
                isAdmin
                lastName
                firstName
                email
                portfolioRole
            }
        }
    }
`;

type EmailChangeFormFields = UpdateUserMutationVariables['userItem'];
type FormType = PurgeNull<PartialForm<WithId<EmailChangeFormFields>>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        email: [emailCondition],
        firstName: [],
        lastName: [],
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
                onValueSet(removeNull({
                    ...user,
                    email: user?.email,
                    firstName: user?.firstName,
                    lastName: user?.lastName,

                }));
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
                        children: 'User email updated successfully!',
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
        if (finalValues.id) {
            updateUser({
                variables: {
                    userItem: finalValues as WithId<EmailChangeFormFields>,
                },
            });
        }
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
            <TextInput
                label="Email"
                name="email"
                value={value.email}
                onChange={onValueChange}
                error={error?.fields?.email}
                disabled={disabled}
            />
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
