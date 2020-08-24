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
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    lengthGreaterThanCondition,
    emailCondition,
} from '#utils/validation';

import route from '../../Root/App/Multiplexer/route';
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
}

const schema: Schema<FormValues> = {
    fields: () => ({
        email: [requiredStringCondition, emailCondition],
        password: [requiredStringCondition, lengthGreaterThanCondition(5)],
    }),
};

function SignIn() {
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
    };

    const handleSubmit = (finalValue: FormValues) => {
        login({
            variables: {
                input: {
                    email: finalValue.email,
                    password: finalValue.password,
                },
            },
        });
    };

    const {
        value,
        error,
        onValueChange,
        onSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    return (
        <div className={styles.signIn}>
            <div className={styles.signInFormContainer}>
                <h2 className={styles.header}>
                    Helix
                </h2>
                <form
                    className={styles.signInForm}
                    onSubmit={onSubmit}
                >
                    {error?.$internal && (
                        <p>
                            {error?.$internal}
                        </p>
                    )}
                    <TextInput
                        label="Email"
                        name="email"
                        value={value.email}
                        onChange={onValueChange}
                        error={error?.fields?.email}
                    />
                    <PasswordInput
                        label="Password"
                        name="password"
                        value={value.password}
                        onChange={onValueChange}
                        error={error?.fields?.password}
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
                            Sign In
                        </Button>
                    </div>
                </form>
                <div className={styles.signUpLinkContainer}>
                    <p>
                        No account yet?
                    </p>
                    <Link
                        to={route.signUp.path}
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
