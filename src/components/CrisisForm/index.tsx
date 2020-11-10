import React, { useMemo } from 'react';
import {
    TextInput,
    MultiSelectInput,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { removeNull } from '#utils/schema';
import type { Schema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';
import {
    idCondition,
    requiredStringCondition,
    requiredListCondition,
} from '#utils/validation';

import {
    BasicEntity,
    PartialForm,
    PurgeNull,
} from '#types';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
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

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type CrisisFormFields = CreateCrisisMutationVariables['crisis'];
type FormType = PurgeNull<PartialForm<WithId<Omit<CrisisFormFields, 'crisisType'> & { crisisType: string }>>>;

const CRISIS_OPTIONS = gql`
    query CrisisOptions {
        countryList {
            results {
                id
                name
            }
        }
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
            }
            crisisNarrative
            crisisType
            id
            name
        }
    }
`;

const CREATE_CRISIS = gql`
    mutation CreateCrisis($crisis: CrisisCreateInputType!){
        createCrisis(data: $crisis) {
            result {
                id
            }
            errors {
                field
                messages
            }
        }
    }
`;

const UPDATE_CRISIS = gql`
    mutation UpdateCrisis($crisis: CrisisUpdateInputType!) {
        updateCrisis(data: $crisis) {
            result {
                id
            }
            errors {
                field
                messages
            }
        }
    }
`;

const schema: Schema<FormType> = {
    fields: () => ({
        id: [idCondition],
        countries: [requiredListCondition],
        name: [requiredStringCondition],
        crisisType: [requiredStringCondition],
        crisisNarrative: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface CrisisFormProps {
    id?: string;
    onCrisisCreate?: (id: BasicEntity['id']) => void;
}

function CrisisForm(props: CrisisFormProps) {
    const {
        id,
        onCrisisCreate,
    } = props;

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

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
                onValueSet(removeNull({
                    ...crisis,
                    countries: crisis?.countries?.map((item) => item.id),
                }));
            },
        },
    );

    const {
        data: insecureData,
        loading: crisisOptionsLoading,
        error: crisisOptionsError,
    } = useQuery<CrisisOptionsQuery>(CRISIS_OPTIONS);

    const data = useMemo(
        () => removeNull(insecureData),
        [insecureData],
    );

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
                    onErrorSet(formError);
                }
                if (onCrisisCreate && result) {
                    onCrisisCreate(result.id);
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    // FIXME: a lot of repeated code for update and create
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
                    onErrorSet(formError);
                }
                if (onCrisisCreate && result) {
                    onCrisisCreate(result.id);
                }
            },
            onError: (errors) => {
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

    const loading = createLoading || updateLoading || crisisOptionsLoading || crisisDataLoading;
    const errored = !!crisisDataError || !!crisisOptionsError;

    const disabled = loading || errored;

    return (
        <form
            className={styles.crisisForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {error?.$internal && (
                <p>
                    {error?.$internal}
                </p>
            )}
            <TextInput
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
                disabled={disabled}
            />
            <MultiSelectInput
                options={data?.countryList?.results}
                label="Country(ies) *"
                name="countries"
                value={value.countries}
                onChange={onValueChange}
                keySelector={basicEntityKeySelector}
                labelSelector={basicEntityLabelSelector}
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
                disabled={disabled}
            />
            <TextInput
                label="Crisis Narrative *"
                name="crisisNarrative"
                value={value.crisisNarrative}
                onChange={onValueChange}
                error={error?.fields?.crisisNarrative}
                disabled={disabled}
            />
            <div className={styles.actions}>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled}
                    variant="primary"
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default CrisisForm;
