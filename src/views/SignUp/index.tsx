import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import useForm from '#utils/form';
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    lengthGreaterThanCondition,
    emailCondition,
} from '#utils/validation';

import styles from './styles.css';

const REGISTER = gql`
  mutation Register($input: RegisterMutationInput!) {
    register(input: $input) {
      errors {
        field
        messages
      }
    }
  }
`;

interface FormValues {
    email: string;
    firstName: string;
    lastName: string;
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
        firstName: [requiredStringCondition],
        lastName: [requiredStringCondition],
        email: [requiredStringCondition, emailCondition],
        password: [requiredStringCondition, lengthGreaterThanCondition(5)],
        passwordConfirmation: [requiredStringCondition, lengthGreaterThanCondition(5)],
    },
};

function SignUp() {
    const [message, setMessage] = useState('');

    interface RegisterVariables {
        input: {
            email: string;
            username: string;
            firstName: string;
            lastName: string;
            password: string;
        }
    }
    interface RegisterResponse {
        register: {
            errors?: { field: string, message: string }[];
        }
    }
    const [register] = useMutation<RegisterResponse, RegisterVariables>(
        REGISTER,
        {
            onCompleted: (data: RegisterResponse) => {
                if (data.register.errors) {
                    // TODO: handle server error
                    console.error(data.register.errors);
                }
                setMessage('Activation link has been sent to your email.');
            },
        },
    );

    const initialFormValues: FormValues = {
        email: '',
        password: '',
        passwordConfirmation: '',
        firstName: '',
        lastName: '',
    };

    const handleSubmit = (finalValue: FormValues) => {
        register({
            variables: {
                input: {
                    email: finalValue.email,
                    username: finalValue.email,
                    firstName: finalValue.firstName,
                    lastName: finalValue.lastName,
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
        <div className={styles.signUp}>
            <div className={styles.signUpFormContainer}>
                <h2 className={styles.header}>
                    Sign Up
                </h2>
                <form
                    className={styles.signUpForm}
                    onSubmit={onSubmit}
                >
                    {message && (
                        <p>
                            {message}
                        </p>
                    )}
                    {error?.$internal && (
                        <p>
                            {error?.$internal}
                        </p>
                    )}
                    <TextInput
                        label="First Name"
                        name="firstName"
                        value={value.firstName}
                        onChange={onValueChange}
                        hintAndError={error?.fields?.firstName}
                    />
                    <TextInput
                        label="Last Name"
                        name="lastName"
                        value={value.lastName}
                        onChange={onValueChange}
                        hintAndError={error?.fields?.lastName}
                    />
                    <TextInput
                        label="Email"
                        name="email"
                        value={value.email}
                        onChange={onValueChange}
                        hintAndError={error?.fields?.email}
                    />
                    <PasswordInput
                        label="Password"
                        name="password"
                        value={value.password}
                        onChange={onValueChange}
                        hintAndError={error?.fields?.password}
                    />
                    <PasswordInput
                        label="Confirm Password"
                        name="passwordConfirmation"
                        value={value.passwordConfirmation}
                        onChange={onValueChange}
                        hintAndError={error?.fields?.passwordConfirmation}
                    />
                    <div className={styles.actionButtons}>
                        <div />
                        <Button
                            variant="primary"
                            type="submit"
                        >
                            Sign Up
                        </Button>
                    </div>
                </form>
                <div className={styles.signInLinkContainer}>
                    <p>
                        Already signed up?
                    </p>
                    <Link
                        // FIXME: use from routes
                        to="/sign-in/"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
