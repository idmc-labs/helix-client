import React, { useCallback, useContext } from 'react';
import {
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import { useParams, useHistory } from 'react-router-dom';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    requiredStringCondition,
    lengthGreaterThanCondition,
    removeNull,
} from '@togglecorp/toggle-form';
import { gql, useMutation } from '@apollo/client';

import SmartLink from '#components/SmartLink';
import NonFieldError from '#components/NonFieldError';
import BrandHeader from '#components/BrandHeader';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';

import Row from '#components/Row';
import { transformToFormError } from '#utils/errorTransform';
import route from '#config/routes';

import { ResetPasswordType, ResetPasswordMutation, ResetPasswordMutationVariables } from '#generated/types';
import styles from './styles.css';

const RESET = gql`
  mutation ResetPassword($input: ResetPasswordType!) {
    resetPassword(data: $input) {
      errors
      ok
    }
  }
`;

type ResetFormFields = ResetPasswordType;
type FormType = PurgeNull<PartialForm<ResetFormFields & { passwordConfirmation: string }>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    validation: (value) => {
        if (
            value?.newPassword
            && value?.passwordConfirmation
            && value.newPassword !== value.passwordConfirmation
        ) {
            return 'The passwords do not match.';
        }
        return undefined;
    },
    fields: (): FormSchemaFields => {
        const basicFields: FormSchemaFields = {
            newPassword: [requiredStringCondition, lengthGreaterThanCondition(5)],
            passwordConfirmation: [requiredStringCondition, lengthGreaterThanCondition(5)],
        };
        return basicFields;
    },
};

const initialResetFields: FormType = {};

function ResetPassword() {
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const history = useHistory();

    const { userId, resetToken } = useParams<{
        userId: string, resetToken: string
    }>();

    const {
        pristine,
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialResetFields, schema);

    const [
        resetPassword,
        { loading },
    ] = useMutation<ResetPasswordMutation, ResetPasswordMutationVariables>(
        RESET,
        {
            onCompleted: (response) => {
                const { resetPassword: resetResponse } = response;
                if (!resetResponse) {
                    return;
                }
                const {
                    errors,
                    ok,
                } = resetResponse;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                } else if (ok) {
                    // NOTE: there can be case where errors is empty but it still errored
                    notify({ children: 'Password changed successfully !' });
                    history.replace(route.signIn.path);
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback(
        (finalValue: FormType) => {
            const {
                // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
                passwordConfirmation,
                ...otherValue
            } = finalValue;
            const completeValue = otherValue as ResetFormFields;
            resetPassword({
                variables: {
                    input: {
                        ...completeValue,
                        passwordResetToken: resetToken,
                        uid: userId,
                    },
                },
            });
        },
        [resetPassword, resetToken, userId],
    );

    return (
        <div className={styles.resetPassword}>
            <div className={styles.resetFormContainer}>
                <BrandHeader className={styles.header} />
                <form
                    className={styles.resetForm}
                    onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                >
                    {loading && <Loading absolute />}
                    <NonFieldError>
                        {error?.$internal}
                    </NonFieldError>
                    <Row>
                        <PasswordInput
                            label="New Password *"
                            name="newPassword"
                            value={value.newPassword}
                            onChange={onValueChange}
                            error={error?.fields?.newPassword}
                            disabled={loading}
                        />
                    </Row>
                    <Row>
                        <PasswordInput
                            label="Confirm New Password *"
                            name="passwordConfirmation"
                            value={value.passwordConfirmation}
                            onChange={onValueChange}
                            error={error?.fields?.passwordConfirmation}
                            disabled={loading}
                        />
                    </Row>
                    <div className={styles.actionButtons}>
                        <div />
                        <Button
                            variant="primary"
                            type="submit"
                            name={undefined}
                            disabled={loading || pristine}
                        >
                            Reset Password
                        </Button>
                    </div>
                </form>
                <div className={styles.resetLinkContainer}>
                    <p>
                        Go back to
                    </p>
                    <SmartLink
                        route={route.signIn}
                    >
                        Login
                    </SmartLink>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
