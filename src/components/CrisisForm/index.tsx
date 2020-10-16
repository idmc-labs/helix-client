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
} from '#types';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import styles from './styles.css';

interface CrisisOptionsResponseFields {
    countryList: {
        results: BasicEntity[];
    };
    crisisType: {
        enumValues: EnumEntity<string>[];
    }
}

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

interface CreateCrisisVariables {
    crisis: CrisisFormFields;
}

interface CreateCrisisResponseFields {
    createCrisis: {
        errors?: ObjectError[];
        crisis: {
            id: string;
        }
    }
}

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

const schema: Schema<Partial<CrisisFormFields>> = {
    fields: () => ({
        countries: [requiredListCondition],
        name: [requiredStringCondition],
        crisisType: [requiredStringCondition],
        crisisNarrative: [requiredStringCondition],
    }),
};

// FIXME: we may not need default form values
const defaultFormValues: Partial<CrisisFormFields> = {};

interface CrisisFormProps {
    value?: Partial<CrisisFormFields>;
    onCrisisCreate?: (id: BasicEntity['id']) => void;
}

function CrisisForm(props: CrisisFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
        onCrisisCreate,
    } = props;

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(initialFormValues, schema);

    const {
        data,
        loading: crisisOptionsLoading,
    } = useQuery<CrisisOptionsResponseFields>(CRISIS_OPTIONS);
    const [
        createCrisis,
        { loading: saveLoading },
    ] = useMutation<CreateCrisisResponseFields, CreateCrisisVariables>(
        CREATE_CRISIS,
        {
            onCompleted: (response) => {
                if (response.createCrisis.errors) {
                    const formError = transformToFormError(response.createCrisis.errors);
                    onErrorSet(formError);
                } else if (onCrisisCreate) {
                    onCrisisCreate(response.createCrisis.crisis?.id);
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValues: Partial<CrisisFormFields>) => {
        createCrisis({
            variables: {
                crisis: finalValues as CrisisFormFields,
            },
        });
    }, [createCrisis]);

    const loading = saveLoading || crisisOptionsLoading;

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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
            />
            <TextInput
                label="Crisis Narrative *"
                name="crisisNarrative"
                value={value.crisisNarrative}
                onChange={onValueChange}
                error={error?.fields?.crisisNarrative}
                disabled={loading}
            />
            <div className={styles.actions}>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={loading}
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default CrisisForm;
