import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import DomainContext from '#components/DomainContext';
import useForm from '#utils/form';
import { User } from '#utils/typings';
import { accumulateErrors, analyzeErrors } from '#utils/schema';
import type { Schema, Error } from '#utils/schema';
import {
    requiredStringCondition,
    lengthGreaterThanCondition,
} from '#utils/validation';

import styles from './styles.css';

const LOGIN = gql`
  mutation Login($input: LoginMutationInput!) {
    login(input: $input) {
      me {
        email
        id
        username
      }
      errors {
        field
        messages
      }
    }
  }
`;

interface FormValues {
    email: string;
    password: string;
    passwordConfirmation: string;
}

const schema: Schema<FormValues> = {
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
    fields: {
        email: [requiredStringCondition],
        password: [requiredStringCondition, lengthGreaterThanCondition(5)],
        passwordConfirmation: [requiredStringCondition, lengthGreaterThanCondition(5)],
    },
};

function Login() {
    const { setUser } = useContext(DomainContext);

    interface LoginVariables {
        input: {
            email: string;
            password: string;
        }
    }
    interface LoginResponse {
        login: {
            me: User;
            errors?: { field: string, message: string }[];
        }
    }
    const [login] = useMutation<LoginResponse, LoginVariables>(
        LOGIN,
        {
            onCompleted: (data: LoginResponse) => {
                if (data.login.errors) {
                    // TODO: handle server error
                    console.error(data.login.errors);
                }
                setUser(data.login.me);
            },
        },
    );

    const initialFormValues: FormValues = {
        email: '',
        password: '',
        passwordConfirmation: '',
    };

    const { state, onStateChange } = useForm(initialFormValues);
    const [errors, setErrors] = useState<Error<FormValues>>({});

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // check for errors here
        const stateErrors = accumulateErrors(state, schema);
        const stateErrored = analyzeErrors(stateErrors);
        setErrors(stateErrors || {});

        if (!stateErrored) {
            login({
                variables: {
                    input: {
                        email: state.email,
                        password: state.password,
                    },
                },
            });
        }
    };

    return (
        <div className={styles.login}>
            <div className={styles.loginFormContainer}>
                <form
                    className={styles.loginForm}
                    onSubmit={handleSubmit}
                >
                    <h2>
                        Login
                    </h2>
                    {errors.$internal && (
                        <p>
                            {errors.$internal}
                        </p>
                    )}
                    <TextInput
                        label="Email"
                        name="email"
                        value={state.email}
                        onChange={onStateChange}
                        hintAndError={errors.fields?.email}
                    />
                    <PasswordInput
                        label="Password"
                        name="password"
                        value={state.password}
                        onChange={onStateChange}
                        hintAndError={errors.fields?.password}
                    />
                    <PasswordInput
                        label="Confirm Password"
                        name="passwordConfirmation"
                        value={state.passwordConfirmation}
                        onChange={onStateChange}
                        hintAndError={errors.fields?.passwordConfirmation}
                    />
                    <div className={styles.actionButtons}>
                        <Link
                            className={styles.forgotPasswordLink}
                            // FIXME: use from routes
                            to="/password-reset/"
                        >
                            Forgot password?
                        </Link>
                        <Button
                            variant="primary"
                            type="submit"
                        >
                            Login
                        </Button>
                    </div>
                </form>
                <div className={styles.registerLinkContainer}>
                    <p>
                        No account yet?
                    </p>
                    <Link
                        // FIXME: use from routes
                        to="/register/"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
