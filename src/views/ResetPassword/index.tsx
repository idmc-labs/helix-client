import React, { useCallback } from 'react';
import {
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

import NonFieldError from '#components/NonFieldError';
import BrandHeader from '#components/BrandHeader';

import Row from '#components/Row';

import { ResetInputType } from '#generated/types';
import styles from './styles.css';

const RESET = gql`
    query ResetPassword($id: ID!) {
        reset(id: $id) {
            id
            password
            reTypePassword
        }
    }
`;

type ResetFormFields = ResetInputType;
type FormType = PurgeNull<PartialForm<ResetFormFields>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

/* const schema = () => ({
    fields: (): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
            password: [requiredStringCondition],
            reTypePassword: [requiredStringCondition],
        };
        return basicFields;
    },
}); */

function ResetPassword() {
    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm();

    const handleSubmit = useCallback(
        (finalValue) => {
            const completeValue = finalValue;
            console.log('Received New password::>>', completeValue);
        },
        [],
    );

    return (
        <div className={styles.resetPassword}>
            <div className={styles.resetFormContainer}>
                <BrandHeader className={styles.header} />
                <form
                    className={styles.resetForm}
                    onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                >
                    <NonFieldError>
                        {error?.$internal}
                    </NonFieldError>
                    <Row>
                        <PasswordInput
                            label="New Password *"
                            name="password"
                            value={value.password}
                            onChange={onValueChange}
                            error={error?.fields?.password}
                        />
                    </Row>
                    <Row>
                        <PasswordInput
                            label="Re-type Password *"
                            name="password"
                            value={value.reTypePassword}
                            onChange={onValueChange}
                            error={error?.fields?.reTypePassword}
                        />
                    </Row>
                    <div className={styles.actionButtons}>
                        <Button
                            variant="primary"
                            type="submit"
                            name={undefined}
                        >
                            Reset
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
