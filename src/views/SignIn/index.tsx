import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import BrandHeader from '#components/BrandHeader';
import DomainContext from '#components/DomainContext';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';
import { PartialForm, PurgeNull } from '#types';
import { removeNull } from '#utils/schema';
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
        fullName
      }
      errors {
        field
        messages
      }
    }
  }
`;

type LoginFormFields = LoginInputType;
type FormType = PurgeNull<PartialForm<LoginFormFields>>;

const schema: Schema<FormType> = {
    fields: () => ({
        email: [requiredStringCondition, emailCondition],
        password: [requiredStringCondition, lengthGreaterThanCondition(5)],
    }),
};

const initialLoginFormFields: FormType = {};

function SignIn() {
    const { setUser } = useContext(DomainContext);

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
                    onErrorSet(formError);
                } else {
                    // FIXME: role is sent as string from the server
                    setUser(removeNull(result));
                }
            },
            onError: (errors) => {
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
                    />
                    <PasswordInput
                        label="Password *"
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
