import React, { useContext } from 'react';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
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

import SmartLink from '#components/SmartLink';
import NonFieldError from '#components/NonFieldError';
import BrandHeader from '#components/BrandHeader';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';

import Row from '#components/Row';
import { transformToFormError } from '#utils/errorTransform';

import { LoginMutation, LoginMutationVariables, LoginInputType } from '#generated/types';
import route from '#config/routes';
import styles from './styles.css';

const LOGIN = gql`
  mutation Login($input: LoginInputType!) {
    login(data: $input) {
      result {
        email
        id
        role
        fullName
        permissions {
            action
            entities
        }
      }
      errors
    }
  }
`;

type LoginFormFields = LoginInputType;
type FormType = PurgeNull<PartialForm<LoginFormFields>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        email: [requiredStringCondition, emailCondition],
        password: [requiredStringCondition, lengthGreaterThanCondition(5)],
    }),
};

const initialLoginFormFields: FormType = {};

function SignIn() {
    const { setUser } = useContext(DomainContext);
    const { notify } = useContext(NotificationContext);

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialLoginFormFields, schema);

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
                const { errors, result } = loginRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to sign in.' });
                    onErrorSet(formError);
                } else {
                    // FIXME: role is sent as string from the server
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
                notify({ children: 'Failed to sign in.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = (finalValue: FormType) => {
        const completeValue = finalValue as LoginFormFields;
        login({
            variables: {
                input: {
                    email: completeValue.email,
                    password: completeValue.password,
                },
            },
        });
    };

    return (
        <div className={styles.signIn}>
            <div className={styles.signInFormContainer}>
                <BrandHeader className={styles.header} />
                <form
                    className={styles.signInForm}
                    onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                >
                    {loading && <Loading absolute />}
                    <NonFieldError>
                        {error?.$internal}
                    </NonFieldError>
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
                    <div className={styles.actionButtons}>
                        <a
                            className={styles.forgotPasswordLink}
                            rel="noreferrer"
                            target="_blank"
                            href="/#"
                        >
                            Forgot password?
                        </a>
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
