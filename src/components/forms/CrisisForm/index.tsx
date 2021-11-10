import React, { useState, useContext, useMemo, useCallback } from 'react';
import {
    TextInput,
    SelectInput,
    Button,
    DateInput,
} from '@togglecorp/toggle-ui';
import {
    ObjectSchema,
    PartialForm,
    PurgeNull,
    removeNull,
    arrayCondition,
    idCondition,
    requiredStringCondition,
    requiredListCondition,
    createSubmitHandler,
    useForm,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import MarkdownEditor from '#components/MarkdownEditor';

import { transformToFormError } from '#utils/errorTransform';
import {
    enumKeySelector,
    enumLabelSelector,
    EnumFix,
    WithId,
} from '#utils/common';

import {
    CrisisOptionsQuery,
    CrisisForFormQuery,
    CrisisForFormQueryVariables,
    CreateCrisisMutation,
    CreateCrisisMutationVariables,
    UpdateCrisisMutation,
    UpdateCrisisMutationVariables,
    Crisis_Type as CrisisType,
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
        dateAccuracy: __type(name: "DATE_ACCURACY") {
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
                idmcShortName
            }
            crisisNarrative
            crisisType
            id
            name
            startDate
            endDate
            startDateAccuracy
            endDateAccuracy
        }
    }
`;

const CREATE_CRISIS = gql`
    mutation CreateCrisis($crisis: CrisisCreateInputType!) {
        createCrisis(data: $crisis) {
            result {
                countries {
                    id
                    idmcShortName
                }
                crisisNarrative
                crisisType
                id
                name
                startDate
                endDate
                startDateAccuracy
                endDateAccuracy
            }
            errors
        }
    }
`;

const UPDATE_CRISIS = gql`
    mutation UpdateCrisis($crisis: CrisisUpdateInputType!) {
        updateCrisis(data: $crisis) {
            result {
                countries {
                    id
                    idmcShortName
                }
                crisisNarrative
                crisisType
                id
                name
                startDate
                endDate
                startDateAccuracy
                endDateAccuracy
            }
            errors
        }
    }
`;

// function to maintain date format ---//
function basicDateFormat(dateValue: string | undefined) {
    const dateInfo = dateValue && new Date(dateValue);
    const convertedDate = dateInfo && `${dateInfo.getDate()}/${dateInfo.getMonth() + 1}/${dateInfo.getFullYear()}`;
    return convertedDate;
}

// Auto-generate functions that are also used for hints
function generateCrisisName(
    countryNames?: string | undefined,
    adminName?: string | undefined,
    startDateInfo?: string | undefined,
) {
    const countryField = countryNames || 'Country/ies';
    const adminField = adminName || '(Admin or location)';
    // TODO: convert startDate to certain format
    const startDateField = startDateInfo || 'Start Date of Violence/Disaster DD/MM/YYY';
    return `${countryField}: ${adminField} - ${startDateField}`;
}

const conflict: CrisisType = 'CONFLICT';
const disaster: CrisisType = 'DISASTER';
const other: CrisisType = 'OTHER';

type CrisisFormFields = CreateCrisisMutationVariables['crisis'];
type FormType = PurgeNull<PartialForm<WithId<EnumFix<CrisisFormFields, 'crisisType' | 'startDateAccuracy' | 'endDateAccuracy'>>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        countries: [requiredListCondition, arrayCondition],
        name: [requiredStringCondition],
        crisisType: [requiredStringCondition],
        crisisNarrative: [requiredStringCondition],
        startDate: [],
        endDate: [],
        startDateAccuracy: [],
        endDateAccuracy: [],
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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const crisisVariables = useMemo(
        (): CrisisForFormQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: crisisDataLoading,
        error: crisisDataError,
    } = useQuery<CrisisForFormQuery, CrisisForFormQueryVariables>(
        CRISIS,
        {
            skip: !crisisVariables,
            variables: crisisVariables,
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
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onCrisisCreate && result) {
                    notify({
                        children: 'Crisis created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onCrisisCreate(result);
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
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Crisis updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    if (onCrisisCreate) {
                        onCrisisCreate(result);
                    }
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

    const handleCrisisName = useCallback(() => {
        const countryNames = countries
            ?.filter((country) => value.countries?.includes(country.id))
            .map((country) => country.idmcShortName)
            .join(', ');

        const adminName = undefined;
        const startDateInfo = value?.startDate && basicDateFormat(value.startDate);

        if (value.crisisType === 'CONFLICT') {
            // eslint-disable-next-line max-len
            const conflictText = generateCrisisName(countryNames, adminName, startDateInfo);
            onValueChange(conflictText, 'name' as const);
        }
        if (value.crisisType === 'DISASTER') {
            // eslint-disable-next-line max-len
            const disasterText = generateCrisisName(countryNames, adminName, startDateInfo);
            onValueChange(disasterText, 'name' as const);
        }
    }, [
        onValueChange,
        countries,
        value.countries,
        value.startDate,
        value.crisisType,
    ]);

    const loading = createLoading || updateLoading || crisisDataLoading;
    const errored = !!crisisDataError;
    const disabled = loading || errored;
    const disableAutoGenerate = !value.crisisType || value.crisisType === other;

    return (
        <form
            className={styles.crisisForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <SelectInput
                    options={data?.crisisType?.enumValues}
                    label="Cause *"
                    name="crisisType"
                    value={value.crisisType}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.crisisType}
                    disabled={disabled || crisisOptionsLoading || !!crisisOptionsError}
                />
            </Row>
            <Row>
                <TextInput
                    label="Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                    hint={(
                        (value.crisisType === conflict && generateCrisisName())
                        || (value.crisisType === disaster && generateCrisisName())
                        || undefined
                    )}
                    actions={(
                        <Button
                            name={undefined}
                            onClick={handleCrisisName}
                            disabled={disableAutoGenerate}
                        >
                            Auto Generate
                        </Button>
                    )}
                />
            </Row>
            <Row>
                <CountryMultiSelectInput
                    options={countries}
                    onOptionsChange={setCountries}
                    label="Countries *"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries?.$internal}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <DateInput
                    label="Start Date"
                    value={value.startDate}
                    onChange={onValueChange}
                    name="startDate"
                    error={error?.fields?.startDate}
                    disabled={disabled}
                />
                <SelectInput
                    options={data?.dateAccuracy?.enumValues}
                    label="Start Date Accuracy"
                    name="startDateAccuracy"
                    value={value.startDateAccuracy}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.startDateAccuracy}
                    disabled={disabled || crisisOptionsLoading || !!crisisOptionsError}
                />
            </Row>
            <Row>
                <DateInput
                    label="End Date"
                    value={value.endDate}
                    onChange={onValueChange}
                    name="endDate"
                    error={error?.fields?.endDate}
                    disabled={disabled}
                />
                <SelectInput
                    options={data?.dateAccuracy?.enumValues}
                    label="End Date Accuracy"
                    name="endDateAccuracy"
                    value={value.endDateAccuracy}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.endDateAccuracy}
                    disabled={disabled || crisisOptionsLoading || !!crisisOptionsError}
                />
            </Row>
            <Row>
                <MarkdownEditor
                    label="Crisis Narrative *"
                    name="crisisNarrative"
                    value={value.crisisNarrative}
                    onChange={onValueChange}
                    error={error?.fields?.crisisNarrative}
                    disabled={disabled}
                />
            </Row>
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
