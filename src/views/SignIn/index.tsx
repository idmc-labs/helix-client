import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import DomainContext from '#components/DomainContext';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';
import { PartialForm } from '#types';
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    lengthGreaterThanCondition,
    emailCondition,
} from '#utils/validation';

import { LoginMutation, LoginMutationVariables, LoginInputType } from '#generated/types';
import route from '../../Root/App/Multiplexer/route';
import styles from './styles.css';

const LOGIN = gql`
  mutation Login($input: LoginInputType!) {
    login(data: $input) {
      result {
        email
        id
        username
        role
      }
      errors {
        field
        messages
      }
    }
  }
`;

type FormValues = LoginInputType;

const schema: Schema<PartialForm<FormValues>> = {
    fields: () => ({
        email: [requiredStringCondition, emailCondition],
        password: [requiredStringCondition, lengthGreaterThanCondition(5)],
    }),
};

const initialFormValues: PartialForm<FormValues> = {};

function SignIn() {
    const { setUser } = useContext(DomainContext);

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(initialFormValues, schema);

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
                    const formError = transformToFormError(errors);
                    onErrorSet(formError);
                } else {
                    // FIXME: role is sent as string from the server
                    setUser(result);
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = (finalValue: PartialForm<FormValues>) => {
        const completeValue = finalValue as FormValues;
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
                <h2 className={styles.header}>
                    Helix
                </h2>
                <form
                    className={styles.signInForm}
                    onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
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
                        disabled={loading}
                    />
                    <PasswordInput
                        label="Password"
                        name="password"
                        value={value.password}
                        onChange={onValueChange}
                        error={error?.fields?.password}
                        disabled={loading}
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
