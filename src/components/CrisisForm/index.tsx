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
import useForm from '#utils/form';
import {
    requiredStringCondition,
    requiredListCondition,
} from '#utils/validation';

import {
    CrisisFormFields,
    BasicEntity,
} from '#types';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import styles from './styles.css';

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

const schema: Schema<CrisisFormFields> = {
    fields: () => ({
        countries: [requiredListCondition],
        name: [requiredStringCondition],
        crisisType: [requiredStringCondition],
        crisisNarrative: [requiredStringCondition],
    }),
};

const defaultFormValues: CrisisFormFields = {
    name: '',
    crisisType: '',
    countries: [],
};

interface CrisisFormProps {
    value?: CrisisFormFields;
    onCrisisCreate?: (id: BasicEntity['id']) => void;
}

const emptyList: unknown[] = [];

function CrisisForm(props: CrisisFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
        onCrisisCreate,
    } = props;

    const { data } = useQuery(CRISIS_OPTIONS);
    const [createCrisis] = useMutation(
        CREATE_CRISIS,
        {
            onCompleted: (response) => {
                if (response.errors) {
                    console.error(response.errors);
                    return;
                }

                if (onCrisisCreate) {
                    onCrisisCreate(response?.createCrisis?.crisis?.id);
                }
            },
        },
    );

    const handleSubmit = React.useCallback((finalValues: CrisisFormFields) => {
        createCrisis({
            variables: {
                crisis: finalValues,
            },
        });
    }, [createCrisis]);

    const {
        value,
        error,
        onValueChange,
        onFormSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    return (
        <form
            className={styles.crisisForm}
            onSubmit={onFormSubmit}
        >
            <TextInput
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
            />
            <MultiSelectInput
                options={data?.countryList?.results ?? emptyList}
                label="Country(ies) *"
                name="countries"
                value={value.countries}
                onChange={onValueChange}
                keySelector={basicEntityKeySelector}
                labelSelector={basicEntityLabelSelector}
                error={error?.fields?.countries}
            />
            <SelectInput
                options={data?.crisisType?.enumValues ?? emptyList}
                label="Crisis Type *"
                name="crisisType"
                value={value.crisisType}
                onChange={onValueChange}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                error={error?.fields?.crisisType}
            />
            <TextInput
                label="Crisis Narrative *"
                name="crisisNarrative"
                value={value.crisisNarrative}
                onChange={onValueChange}
                error={error?.fields?.crisisNarrative}
            />
            <Button
                type="submit"
                name={undefined}
            >
                Submit
            </Button>
        </form>
    );
}

export default CrisisForm;
