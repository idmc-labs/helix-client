import React, { useCallback, useContext } from 'react';
import {
    Button,
    NumberInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
} from '@apollo/client';
import {
    ObjectSchema,
    PartialForm,
    PurgeNull,
    useForm,
    createSubmitHandler,
    removeNull,
    requiredCondition,
    integerCondition,
} from '@togglecorp/toggle-form';

import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import { transformToFormError } from '#utils/errorTransform';
import {
    CarryOverHouseholdSizeMutation,
    CarryOverHouseholdSizeMutationVariables,
} from '#generated/types';

import styles from './styles.module.css';

const CARRY_OVER_HOUSEHOLD_SIZE = gql`
    mutation CarryOverHouseholdSize($targetYear: Int!) {
        carryOverHouseholdSize(targetYear: $targetYear) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

type FormType = PurgeNull<PartialForm<CarryOverHouseholdSizeMutationVariables>>;
type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        targetYear: [requiredCondition, integerCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface CarryOverFormProps {
    onFormCancel: () => void;
    onFormSave: () => void;
}

function CarryOverForm(props: CarryOverFormProps) {
    const {
        onFormCancel,
        onFormSave,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(defaultFormValues, schema);

    const [
        carryOverHouseholdSize,
        { loading },
    ] = useMutation<CarryOverHouseholdSizeMutation, CarryOverHouseholdSizeMutationVariables>(
        CARRY_OVER_HOUSEHOLD_SIZE,
        {
            onCompleted: (response) => {
                const { carryOverHouseholdSize: carryOverResponse } = response;
                if (!carryOverResponse) {
                    return;
                }
                const { errors, ok, result } = carryOverResponse;
                if (errors) {
                    notifyGQLError(errors);
                    onErrorSet(transformToFormError(removeNull(errors)));
                }
                if (ok) {
                    notify({
                        children: `${result?.length ?? 0} AHHS values carried over successfully!`,
                        variant: 'success',
                    });
                    onFormSave();
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback(
        (finalValue: FormType) => {
            carryOverHouseholdSize({
                variables: finalValue as CarryOverHouseholdSizeMutationVariables,
            });
        },
        [carryOverHouseholdSize],
    );

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <NumberInput
                label="Target Year *"
                name="targetYear"
                value={value.targetYear}
                onChange={onValueChange}
                error={error?.fields?.targetYear}
                disabled={loading}
                autoFocus
            />
            <FormActions>
                <Button
                    name={undefined}
                    onClick={onFormCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={loading || pristine}
                    variant="primary"
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default CarryOverForm;
