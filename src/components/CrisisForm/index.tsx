import React from 'react';
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
import type { Schema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError, ObjectError } from '#utils/errorTransform';
import {
    requiredStringCondition,
    requiredListCondition,
} from '#utils/validation';

import {
    CrisisFormFields,
    BasicEntity,
    EnumEntity,
    PartialForm,
} from '#types';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };

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
        createCrisis(crisis: $crisis) {
            crisis {
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
        updateCrisis(crisis: $crisis) {
            crisis {
                id
            }
            errors {
                field
                messages
            }
        }
    }
`;

interface CrisisOptionsResponseFields {
    countryList: {
        results: BasicEntity[];
    };
    crisisType: {
        enumValues: EnumEntity<string>[];
    }
}

interface CrisisResponseFields {
    crisis: {
        id: string;
        name: string;
        crisisType: 'DISASTER' | 'CONFLICT';
        crisisNarrative?: string;
        countries?: { id: string }[];
    }
}

interface CrisisVariables {
    id: string | undefined;
}

interface CreateCrisisResponseFields {
    createCrisis: {
        errors?: ObjectError[];
        crisis: {
            id: string;
        }
    }
}

interface CreateCrisisVariables {
    crisis: CrisisFormFields;
}

interface UpdateCrisisResponseFields {
    updateCrisis: {
        errors?: ObjectError[];
        crisis: {
            id: string;
        }
    }
}

interface UpdateCrisisVariables {
    crisis: WithId<CrisisFormFields>;
}

const schema: Schema<PartialForm<WithId<CrisisFormFields>>> = {
    fields: () => ({
        id: [],
        countries: [requiredListCondition],
        name: [requiredStringCondition],
        crisisType: [requiredStringCondition],
        crisisNarrative: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<WithId<CrisisFormFields>> = {};

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
    } = useQuery<CrisisResponseFields, CrisisVariables>(
        CRISIS,
        {
            skip: !id,
            variables: { id },
            onCompleted: (response) => {
                const { crisis } = response;
                onValueSet({
                    ...crisis,
                    countries: crisis.countries?.map((item) => item.id),
                });
            },
        },
    );

    const {
        data,
        loading: crisisOptionsLoading,
        error: crisisOptionsError,
    } = useQuery<CrisisOptionsResponseFields>(CRISIS_OPTIONS);

    const [
        createCrisis,
        { loading: createLoading },
    ] = useMutation<CreateCrisisResponseFields, CreateCrisisVariables>(
        CREATE_CRISIS,
        {
            onCompleted: (response) => {
                if (response.createCrisis.errors) {
                    const formError = transformToFormError(response.createCrisis.errors);
                    onErrorSet(formError);
                } else if (onCrisisCreate) {
                    onCrisisCreate(response.createCrisis.crisis.id);
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
    ] = useMutation<UpdateCrisisResponseFields, UpdateCrisisVariables>(
        UPDATE_CRISIS,
        {
            onCompleted: (response) => {
                if (response.updateCrisis.errors) {
                    const formError = transformToFormError(response.updateCrisis.errors);
                    onErrorSet(formError);
                } else if (onCrisisCreate) {
                    onCrisisCreate(response.updateCrisis.crisis.id);
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValues: PartialForm<WithId<CrisisFormFields>>) => {
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
