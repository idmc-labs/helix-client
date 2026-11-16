import React, { useCallback, useContext } from 'react';
import {
    Button,
    DateInput,
    NumberInput,
    TextArea,
    TextInput,
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
    requiredStringCondition,
} from '@togglecorp/toggle-form';

import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import { transformToFormError } from '#utils/errorTransform';
import { urlConditionWithProtocolCheck } from '#utils/common';
import {
    CreateHouseholdSizeMutation,
    CreateHouseholdSizeMutationVariables,
    HouseholdSizeListQuery,
} from '#generated/types';

import styles from './styles.module.css';

const CREATE_HOUSEHOLD_SIZE = gql`
    mutation CreateHouseholdSize($data: HouseholdSizeCreateInputType!) {
        createHouseholdSize(data: $data) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

type HouseholdSizeRecord = Pick<
    NonNullable<NonNullable<HouseholdSizeListQuery['householdSizeList']>['results']>[number],
    'country' | 'year' | 'size' | 'dataSourceCategory' | 'source' | 'sourceLink' | 'referenceDate'
>;

type HouseholdSizeFormFields = CreateHouseholdSizeMutationVariables['data'];
type FormType = PurgeNull<PartialForm<HouseholdSizeFormFields>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        country: [requiredCondition],
        year: [requiredCondition],
        size: [requiredCondition],
        dataSourceCategory: [requiredStringCondition],
        source: [requiredStringCondition],
        sourceLink: [urlConditionWithProtocolCheck],
        referenceDate: [],
        notes: [],
    }),
};

interface HouseholdSizeFormProps {
    householdSize: HouseholdSizeRecord;
    onFormCancel: () => void;
    onFormSave: () => void;
}

function HouseholdSizeForm(props: HouseholdSizeFormProps) {
    const {
        householdSize,
        onFormCancel,
        onFormSave,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const initialFormValues: PartialForm<FormType> = removeNull({
        country: householdSize.country.id,
        year: householdSize.year,
        size: householdSize.size,
        dataSourceCategory: householdSize.dataSourceCategory,
        source: householdSize.source,
        sourceLink: householdSize.sourceLink,
        referenceDate: householdSize.referenceDate,
    });

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
    } = useForm(initialFormValues, schema);

    const [
        createHouseholdSize,
        { loading: createLoading },
    ] = useMutation<CreateHouseholdSizeMutation, CreateHouseholdSizeMutationVariables>(
        CREATE_HOUSEHOLD_SIZE,
        {
            onCompleted: (response) => {
                const { createHouseholdSize: createHouseholdSizeRes } = response;
                if (!createHouseholdSizeRes) {
                    return;
                }
                const { errors, result } = createHouseholdSizeRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'AHHS value updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
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
        (finalValues: PartialForm<FormType>) => {
            createHouseholdSize({
                variables: {
                    data: finalValues,
                } as CreateHouseholdSizeMutationVariables,
            });
        },
        [createHouseholdSize],
    );

    const disabled = createLoading;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {createLoading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Country"
                name="countryName"
                value={householdSize.country.name}
                readOnly
            />
            <TextInput
                label="Year"
                name="yearDisplay"
                value={String(householdSize.year)}
                readOnly
            />
            <NumberInput
                label="AHHS *"
                name="size"
                value={value.size}
                onChange={onValueChange}
                error={error?.fields?.size}
                disabled={disabled}
                autoFocus
            />
            <DateInput
                label="Reference Date"
                name="referenceDate"
                value={value.referenceDate}
                onChange={onValueChange}
                error={error?.fields?.referenceDate}
                disabled={disabled}
            />
            <TextInput
                label="Data Source Category *"
                name="dataSourceCategory"
                value={value.dataSourceCategory}
                onChange={onValueChange}
                error={error?.fields?.dataSourceCategory}
                disabled={disabled}
            />
            <TextInput
                label="Source *"
                name="source"
                value={value.source}
                onChange={onValueChange}
                error={error?.fields?.source}
                disabled={disabled}
            />
            <TextInput
                label="Source Link"
                name="sourceLink"
                value={value.sourceLink}
                onChange={onValueChange}
                error={error?.fields?.sourceLink}
                disabled={disabled}
            />
            <TextArea
                label="Reason for Correction"
                name="notes"
                value={value.notes}
                onChange={onValueChange}
                error={error?.fields?.notes}
                disabled={disabled}
            />
            <FormActions>
                <Button
                    name={undefined}
                    onClick={onFormCancel}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    variant="primary"
                    disabled={disabled || pristine}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default HouseholdSizeForm;
