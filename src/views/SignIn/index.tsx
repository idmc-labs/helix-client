import React, { useContext, useState, useCallback, useMemo, useRef } from 'react';
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
import NonFieldError from '#components/NonFieldError';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';
import logo from '#resources/img/logo.png';

import { transformToFormError } from '#utils/errorTransform';

import { LoginMutation, LoginMutationVariables, LoginInputType } from '#generated/types';
import route from '#config/routes';
import styles from './styles.css';

const HCaptchaSitekey = process.env.REACT_APP_HCATPCHA_SITEKEY as string;

const LOGIN = gql`
    mutation Login($input: LoginInputType!) {
        login(data: $input) {
            result {
                id
                fullName
                portfolioRole
                portfolios {
                    results {
                        id
                        role
                        monitoringSubRegion {
                            id
                            name
                            countries {
                                id
                                idmcShortName
                                boundingBox
                                iso2
                            }
                        }
                    }
                }
                permissions {
                    action
                    entities
                }
            }
            captchaRequired
            errors
            ok
        }
    }
`;

type LoginFormFields = LoginInputType;
type FormType = PurgeNull<PartialForm<LoginFormFields>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema = (captchaRequired: boolean): FormSchema => ({
    fields: (): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
            email: [requiredStringCondition, emailCondition],
            password: [requiredStringCondition, lengthGreaterThanCondition(5)],
            // captcha: [clearCondition],
        };
        if (captchaRequired) {
            basicFields = {
                ...basicFields,
                captcha: [requiredStringCondition],
            };
        }
        return basicFields;
    },
});

const initialLoginFormFields: FormType = {};

function SignIn() {
    const { setUser } = useContext(DomainContext);
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [captchaRequired, setCaptchaRequired] = useState(false);

    const elementRef = useRef<Captcha>(null);

    const mySchema = useMemo(
        () => schema(captchaRequired),
        [captchaRequired],
    );

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialLoginFormFields, mySchema);

    const [
        login,
        { loading },
    ] = useMutation<LoginMutation, LoginMutationVariables>(
        LOGIN,
        {
            onCompleted: (response) => {
                const { login: loginRes } = response;
                if (!loginRes) {
                    return;
                }
                const {
                    errors,
                    result,
                    captchaRequired: captchaRequiredFromResponse,
                    ok,
                } = loginRes;

                setCaptchaRequired(captchaRequiredFromResponse);

                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                } else if (ok) {
                    // NOTE: there can be case where errors is empty but it still errored
                    setUser(removeNull(result));
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect-to-mmp');
                    if (
                        redirect === 'true'
                        && process.env.REACT_APP_MMP_ENDPOINT
                    ) {
                        window.location.href = process.env.REACT_APP_MMP_ENDPOINT;
                    }
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
        (finalValue: FormType) => {
            const completeValue = finalValue as LoginFormFields;
            elementRef.current?.resetCaptcha();
            onValueChange(undefined, 'captcha');
            login({
                variables: {
                    input: {
                        ...completeValue,
                        siteKey: HCaptchaSitekey,
                    },
                },
            });
        },
        [login, onValueChange],
    );

    return (
        <div className={styles.signIn}>
            <div className={styles.signInFormContainer}>
                <img
                    className={styles.logo}
                    src={logo}
                    alt="logo"
                />
                <form
                    className={styles.signInForm}
                    onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                >
                    {loading && <Loading absolute />}
                    <NonFieldError>
                        {error?.$internal}
                    </NonFieldError>
                    <TextInput
                        label="Email *"
                        name="email"
                        value={value.email}
                        onChange={onValueChange}
                        error={error?.fields?.email}
                        disabled={loading}
                        autoFocus
                    />
                    <PasswordInput
                        label="Password *"
                        name="password"
                        value={value.password}
                        onChange={onValueChange}
                        error={error?.fields?.password}
                        disabled={loading}
                    />
                    {captchaRequired && (
                        <HCaptcha
                            elementRef={elementRef}
                            siteKey={HCaptchaSitekey}
                            name="captcha"
                            // value={value.captcha}
                            onChange={onValueChange}
                            error={error?.fields?.captcha}
                            disabled={loading}
                        />
                    )}
                    <div className={styles.actionButtons}>
                        <SmartLink
                            route={route.forgetPassword}
                        >
                            Forgot Password?
                        </SmartLink>
                        <Button
                            variant="primary"
                            type="submit"
                            name={undefined}
                            disabled={loading}
                        >
                            Sign In
                        </Button>
                    </div>
                </form>
                <div className={styles.signUpLinkContainer}>
                    <p>
                        No account yet?
                    </p>
                    <SmartLink
                        route={route.signUp}
                    >
                        Sign Up
                    </SmartLink>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
