import React, { useCallback, useContext, useRef } from 'react';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import Captcha from '@hcaptcha/react-hcaptcha';
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
import { useHistory } from 'react-router-dom';

import HCaptcha from '#components/HCaptcha';
import NonFieldError from '#components/NonFieldError';
import BrandHeader from '#components/BrandHeader';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';

import Row from '#components/Row';
import { transformToFormError } from '#utils/errorTransform';
import route from '#config/routes';

import { GenerateResetPasswordTokenType, GenerateResetPasswordTokenMutation, GenerateResetPasswordTokenMutationVariables } from '#generated/types';
import styles from './styles.css';

const HCaptchaSitekey = process.env.REACT_APP_HCATPCHA_SITEKEY as string;

const FORGET_PASSWORD = gql`
  mutation generateResetPasswordToken($input: GenerateResetPasswordTokenType!) {
    generateResetPasswordToken(data: $input) {
      errors
      ok
    }
  }
`;

type ResetFormFields = GenerateResetPasswordTokenType;
type FormType = PurgeNull<PartialForm<ResetFormFields>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => {
        const basicFields: FormSchemaFields = {
            email: [requiredStringCondition],
            captcha: [requiredStringCondition],
        };
        return basicFields;
    },
};

const initialResetFields: FormType = {};

function ForgetPassword() {
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const elementRef = useRef<Captcha>(null);
    const history = useHistory();

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialResetFields, schema);

    const [
        forgetPassword,
        { loading },
    ] = useMutation<GenerateResetPasswordTokenMutation,
        GenerateResetPasswordTokenMutationVariables>(
            FORGET_PASSWORD,
            {
                onCompleted: (response) => {
                    const { generateResetPasswordToken: resetResponse } = response;
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
                        notify({ children: 'Password Reset link has been sent.' });
                        history.push(route.signIn.path);
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
            elementRef.current?.resetCaptcha();
            // onValueChange(undefined, 'captcha');
            forgetPassword({
                variables: {
                    input: {
                        ...completeValue,
                        siteKey: HCaptchaSitekey,
                    },
                },
            });
        },
        [forgetPassword],
    );

    return (
        <div className={styles.forgetPassword}>
            <div className={styles.forgetPasswordContainer}>
                <BrandHeader className={styles.header} />
                <form
                    className={styles.emailForm}
                    onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                >
                    {loading && <Loading absolute />}
                    <NonFieldError>
                        {error?.$internal}
                    </NonFieldError>
                    <Row>
                        <TextInput
                            label="Email"
                            name="email"
                            value={value.email}
                            onChange={onValueChange}
                            error={error?.fields?.email}
                            disabled={loading}
                        />
                    </Row>
                    <Row>
                        <HCaptcha
                            elementRef={elementRef}
                            siteKey={HCaptchaSitekey}
                            name="captcha"
                            onChange={onValueChange}
                            error={error?.fields?.captcha}
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
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgetPassword;
