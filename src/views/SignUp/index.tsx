import React, { useState, useContext, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import Captcha from '@hcaptcha/react-hcaptcha';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredStringCondition,
    emailCondition,
    lengthGreaterThanCondition,
} from '@togglecorp/toggle-form';
import { gql, useMutation } from '@apollo/client';

import HCaptcha from '#components/HCaptcha';
import SmartLink from '#components/SmartLink';
import BrandHeader from '#components/BrandHeader';
import NonFieldError from '#components/NonFieldError';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';

import Row from '#components/Row';
import { transformToFormError } from '#utils/errorTransform';

import { RegisterMutation, RegisterMutationVariables, RegisterInputType } from '#generated/types';
import route from '#config/routes';
import styles from './styles.css';

const HCaptchaSitekey = process.env.REACT_APP_HCATPCHA_SITEKEY as string;

const REGISTER = gql`
  mutation Register($input: RegisterInputType!) {
    register(data: $input) {
        captchaRequired
        errors
        ok
    }
  }
`;

type RegisterFormFields = RegisterInputType;
type FormType = PurgeNull<PartialForm<RegisterInputType & { passwordConfirmation: string }>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    validation: (value) => {
        if (
            value.password
            && value.passwordConfirmation
            && value.password !== value.passwordConfirmation
        ) {
            return 'The passwords do not match.';
        }
        return undefined;
    },
    fields: (): FormSchemaFields => ({
        firstName: [requiredStringCondition],
        lastName: [requiredStringCondition],
        email: [requiredStringCondition, emailCondition],
        password: [requiredStringCondition, lengthGreaterThanCondition(5)],
        passwordConfirmation: [requiredStringCondition, lengthGreaterThanCondition(5)],
        captcha: [requiredStringCondition],
    }),
};

const initialFormValues: FormType = {};

function SignUp() {
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const history = useHistory();

    const [redirect, setRedirect] = useState(false);

    const elementRef = useRef<Captcha>(null);

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialFormValues, schema);

    const [
        register,
        { loading },
    ] = useMutation<RegisterMutation, RegisterMutationVariables>(
        REGISTER,
        {
            onCompleted: (response) => {
                const { register: registerRes } = response;
                if (!registerRes) {
                    return;
                }
                const { errors, ok } = registerRes;

                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                } else if (ok) {
                    notify({ children: 'Please contact administrator to activate your account.' });
                    setRedirect(true);
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

    const handleSubmit = (finalValue: FormType) => {
        const {
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            passwordConfirmation,
            ...otherValue
        } = finalValue;
        const completeValue = otherValue as RegisterFormFields;
        elementRef.current?.resetCaptcha();
        onValueChange(undefined, 'captcha');
        register({
            variables: {
                input: {
                    ...completeValue,
                    siteKey: HCaptchaSitekey,
                },
            },
        });
    };

    if (redirect) {
        history.push('/sign-in/');
    }

    return (
        <div className={styles.signUp}>
            <div className={styles.signUpFormContainer}>
                <BrandHeader className={styles.header} />
                <form
                    className={styles.signUpForm}
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
                            disabled={loading}
                        />
                        <TextInput
                            label="Last Name *"
                            name="lastName"
                            value={value.lastName}
                            onChange={onValueChange}
                            error={error?.fields?.lastName}
                            disabled={loading}
                        />
                    </Row>
                    <Row>
                        <TextInput
                            label="Email *"
                            name="email"
                            value={value.email}
                            onChange={onValueChange}
                            error={error?.fields?.email}
                            disabled={loading}
                        />
                    </Row>
                    <Row>
                        <PasswordInput
                            label="Password *"
                            name="password"
                            value={value.password}
                            onChange={onValueChange}
                            error={error?.fields?.password}
                            disabled={loading}
                        />
                    </Row>
                    <Row>
                        <PasswordInput
                            label="Confirm Password *"
                            name="passwordConfirmation"
                            value={value.passwordConfirmation}
                            onChange={onValueChange}
                            error={error?.fields?.passwordConfirmation}
                            disabled={loading}
                        />
                    </Row>
                    <Row>
                        <HCaptcha
                            elementRef={elementRef}
                            siteKey={HCaptchaSitekey}
                            name="captcha"
                            // value={value.captcha}
                            onChange={onValueChange}
                            error={error?.fields?.captcha}
                            disabled={loading}
                        />
                    </Row>
                    <div className={styles.actionButtons}>
                        <div />
                        <Button
                            variant="primary"
                            type="submit"
                            name={undefined}
                            disabled={loading}
                        >
                            Sign Up
                        </Button>
                    </div>
                </form>
                <div className={styles.signInLinkContainer}>
                    <p>
                        Already signed up?
                    </p>
                    <SmartLink
                        route={route.signIn}
                    >
                        Sign In
                    </SmartLink>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
