import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import DomainContext from '#components/DomainContext';
import { User } from '#utils/typings';

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

function Login() {
    const { setUser } = useContext(DomainContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

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

    const [errors, setErrors] = useState({
        $internal: '',
        email: '',
        password: '',
        passwordConfirmation: '',
    });

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const userValidation = (
            (!email && 'This field is required')
            || ''
        );
        const passwordValidation = (
            (!password && 'This field is required')
            || ''
        );
        const passwordConfirmationValidation = (
            (!passwordConfirmation && 'This field is required')
            || (password && password !== passwordConfirmation && 'The passwords do not match')
            || ''
        );

        setErrors({
            $internal: '',
            email: userValidation,
            password: passwordValidation,
            passwordConfirmation: passwordConfirmationValidation,
        });

        const hasErrors = userValidation || passwordValidation || passwordConfirmationValidation;
        if (!hasErrors) {
            login({
                variables: { input: { email, password } },
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
                    <TextInput
                        label="Email"
                        name="email"
                        value={email}
                        onChange={setEmail}
                    />
                    <PasswordInput
                        label="Password"
                        name="password"
                        value={password}
                        onChange={setPassword}
                    />
                    <PasswordInput
                        label="Confirm Password"
                        name="passwordConfirmation"
                        value={passwordConfirmation}
                        onChange={setPasswordConfirmation}
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
