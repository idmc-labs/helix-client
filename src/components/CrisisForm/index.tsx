import React, { useState, useContext } from 'react';
import {
    TextInput,
    TextArea,
    SelectInput,
    Button,
    DateInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput, { CountryOption } from '#components/CountryMultiSelectInput';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import { removeNull } from '#utils/schema';
import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';
import {
    idCondition,
    requiredStringCondition,
    requiredListCondition,
} from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import {
    CrisisOptionsQuery,
    CrisisForFormQuery,
    CrisisForFormQueryVariables,
    CreateCrisisMutation,
    CreateCrisisMutationVariables,
    UpdateCrisisMutation,
    UpdateCrisisMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const CRISIS_OPTIONS = gql`
    query CrisisOptions {
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

const CRISIS = gql`
    query CrisisForForm($id: ID!) {
        crisis(id: $id) {
            countries {
                id
                name
            }
            crisisNarrative
            crisisType
            id
            name
            startDate
            endDate
        }
    }
`;

const CREATE_CRISIS = gql`
    mutation CreateCrisis($crisis: CrisisCreateInputType!){
        createCrisis(data: $crisis) {
            result {
                id
                name
            }
            errors
        }
    }
`;

const UPDATE_CRISIS = gql`
    mutation UpdateCrisis($crisis: CrisisUpdateInputType!) {
        updateCrisis(data: $crisis) {
            result {
                id
                name
            }
            errors
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type CrisisFormFields = CreateCrisisMutationVariables['crisis'];
type FormType = PurgeNull<PartialForm<WithId<Omit<CrisisFormFields, 'crisisType'> & { crisisType: string }>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        countries: [requiredListCondition],
        name: [requiredStringCondition],
        crisisType: [requiredStringCondition],
        crisisNarrative: [],
        startDate: [],
        endDate: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface CrisisFormProps {
    id?: string;
    onCrisisCreate?: (result: NonNullable<NonNullable<CreateCrisisMutation['createCrisis']>['result']>) => void;
    onCrisisFormCancel: () => void;
}

function CrisisForm(props: CrisisFormProps) {
    const {
        id,
        onCrisisCreate,
        onCrisisFormCancel,
    } = props;

    const [countries, setCountries] = useState<CountryOption[] | null | undefined>();

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const { notify } = useContext(NotificationContext);

    const {
        loading: crisisDataLoading,
        error: crisisDataError,
    } = useQuery<CrisisForFormQuery, CrisisForFormQueryVariables>(
        CRISIS,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { crisis } = response;
                if (crisis?.countries) {
                    setCountries(crisis.countries);
                }
                onValueSet(removeNull({
                    ...crisis,
                    countries: crisis?.countries?.map((item) => item.id),
                }));
            },
        },
    );

    const {
        data,
        loading: crisisOptionsLoading,
        error: crisisOptionsError,
    } = useQuery<CrisisOptionsQuery>(CRISIS_OPTIONS);

    const [
        createCrisis,
        { loading: createLoading },
    ] = useMutation<CreateCrisisMutation, CreateCrisisMutationVariables>(
        CREATE_CRISIS,
        {
            onCompleted: (response) => {
                const { createCrisis: createCrisisRes } = response;
                if (!createCrisisRes) {
                    return;
                }
                const { errors, result } = createCrisisRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to create crisis.' });
                    onErrorSet(formError);
                }
                if (onCrisisCreate && result) {
                    notify({ children: 'Crisis created successfully!' });
                    onPristineSet(true);
                    onCrisisCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to create crisis.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateCrisis,
        { loading: updateLoading },
    ] = useMutation<UpdateCrisisMutation, UpdateCrisisMutationVariables>(
        UPDATE_CRISIS,
        {
            onCompleted: (response) => {
                const { updateCrisis: updateCrisisRes } = response;
                if (!updateCrisisRes) {
                    return;
                }
                const { errors, result } = updateCrisisRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to update crisis.' });
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Crisis updated successfully!' });
                    onPristineSet(true);
                    if (onCrisisCreate) {
                        onCrisisCreate(result);
                    }
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update crisis.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateCrisis({
                variables: {
                    crisis: finalValues as WithId<CrisisFormFields>,
                },
            });
        } else {
            createCrisis({
                variables: {
                    crisis: finalValues as CrisisFormFields,
                },
            });
        }
    }, [createCrisis, updateCrisis]);

    const loading = createLoading || updateLoading || crisisDataLoading;
    const errored = !!crisisDataError;
    const disabled = loading || errored;

    return (
        <form
            className={styles.crisisForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                disabled={disabled}
            />
            <CountryMultiSelectInput
                options={countries}
                onOptionsChange={setCountries}
                label="Countries *"
                name="countries"
                value={value.countries}
                onChange={onValueChange}
                error={error?.fields?.countries}
                disabled={disabled}
            />
            <SelectInput
                options={data?.crisisType?.enumValues}
                label="Crisis Type *"
                name="crisisType"
                value={value.crisisType}
                onChange={onValueChange}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                error={error?.fields?.crisisType}
                disabled={disabled || crisisOptionsLoading || !!crisisOptionsError}
            />
            <DateInput
                label="Start Date"
                value={value.startDate}
                onChange={onValueChange}
                name="startDate"
                error={error?.fields?.startDate}
                disabled={disabled}
            />
            <DateInput
                label="End Date"
                value={value.endDate}
                onChange={onValueChange}
                name="endDate"
                error={error?.fields?.endDate}
                disabled={disabled}
            />
            <TextArea
                label="Crisis Narrative"
                name="crisisNarrative"
                value={value.crisisNarrative}
                onChange={onValueChange}
                error={error?.fields?.crisisNarrative}
                disabled={disabled}
            />
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onCrisisFormCancel}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                    className={styles.button}
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default CrisisForm;
