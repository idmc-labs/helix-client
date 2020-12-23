import React, { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Button,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import SmartLink from '#components/SmartLink';
import BrandHeader from '#components/BrandHeader';
import NonFieldError from '#components/NonFieldError';
import Loading from '#components/Loading';

import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';
import type { ObjectSchema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import {
    requiredStringCondition,
    lengthGreaterThanCondition,
    emailCondition,
} from '#utils/validation';
import { PartialForm, PurgeNull } from '#types';

import { RegisterMutation, RegisterMutationVariables, RegisterInputType } from '#generated/types';
import route from '#config/routes';
import styles from './styles.css';

const REGISTER = gql`
  mutation Register($input: RegisterInputType!) {
    register(data: $input) {
        errors
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
    }),
};

const initialFormValues: FormType = {};

function SignUp() {
    const [message, setMessage] = useState('');

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
                const { errors } = registerRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                setMessage('Activation link has been sent to your email.');
            },
        },
    );

    const handleSubmit = (finalValue: FormType) => {
        const completeValue = finalValue as RegisterFormFields;
        register({
            variables: {
                input: {
                    email: completeValue.email,
                    username: completeValue.email,
                    firstName: completeValue.firstName,
                    lastName: completeValue.lastName,
                    password: completeValue.password,
                },
            },
        });
    };

    return (
        <div className={styles.signUp}>
            <div className={styles.signUpFormContainer}>
                <BrandHeader className={styles.header} />
                <form
                    className={styles.signUpForm}
                    onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                >
                    {loading && <Loading absolute />}
                    {message && (
                        <p>
                            {message}
                        </p>
                    )}
                    <NonFieldError>
                        {error?.$internal}
                    </NonFieldError>
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
                    <PasswordInput
                        label="Confirm Password *"
                        name="passwordConfirmation"
                        value={value.passwordConfirmation}
                        onChange={onValueChange}
                        error={error?.fields?.passwordConfirmation}
                        disabled={loading}
                    />
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
