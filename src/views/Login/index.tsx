import React, { useContext } from 'react';
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

    interface FormValues {
        email: string;
        age: number;
        password: string;
        passwordConfirmation: string;
    }

    const initialFormValues: FormValues = {
        email: '',
        age: 0,
        password: '',
        passwordConfirmation: '',
    };

    const { state, onStateChange } = useForm(initialFormValues);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        login({
            variables: {
                input: {
                    email: state.email,
                    password: state.password,
                },
            },
        });
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
                        value={state.email}
                        onChange={onStateChange}
                    />
                    <PasswordInput
                        label="Password"
                        name="password"
                        value={state.password}
                        onChange={onStateChange}
                    />
                    <PasswordInput
                        label="Confirm Password"
                        name="passwordConfirmation"
                        value={state.passwordConfirmation}
                        onChange={onStateChange}
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
