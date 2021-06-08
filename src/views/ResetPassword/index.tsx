import React, { useCallback, useContext } from 'react';
import {
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';

import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    requiredStringCondition,
    removeNull,
} from '@togglecorp/toggle-form';
import { gql, useMutation } from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import BrandHeader from '#components/BrandHeader';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';

import Row from '#components/Row';
import { transformToFormError } from '#utils/errorTransform';

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
type FormType = PurgeNull<PartialForm<ResetFormFields>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
            newPassword: [requiredStringCondition],
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

    const {
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
                    console.log("Response OK for ResetPassword component:::::");
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
            const completeValue = finalValue as ResetFormFields;
            console.log('Received New password::>>', completeValue);
            resetPassword({
                variables: {
                    input: {
                        ...completeValue,
                    }
                }
            })
        },
        [resetPassword],
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
                    <div className={styles.actionButtons}>
                        <Button
                            variant="primary"
                            type="submit"
                            name={undefined}
                            disabled={loading}
                        >
                            Submit New Password
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
