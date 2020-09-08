import React from 'react';
import {
    TextInput,
    Checkbox,
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
    EnumEntity,
} from '#types';
import styles from './styles.css';

const CRISIS_OPTIONS = gql`
    query CrisisOptions {
        countryList {
            results {
                id
                name
            }
        }
        __type(name: "CRISIS_TYPE") {
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
                arrayErrors {
                    key
                }
                field
                messages
            }
        }
    }
`;

interface CrisisFormProps {
    value?: CrisisFormFields;
}

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
    crisisNarrative: '',
    countries: [],
};

const entryKeySelector = (d: BasicEntity) => d.id;
const entryLabelSelector = (d: BasicEntity) => d.name;

const enumKeySelector = (d: EnumEntity) => d.name;
const enumLabelSelector = (d: EnumEntity) => d.description;

function CrisisForm(props: CrisisFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
    } = props;

    const { data } = useQuery(CRISIS_OPTIONS);
    const [
        countryOptions,
        crisisTypeOptions,
    ] = React.useMemo(() => ([
        data?.countryList?.results || [],
        data?.__type?.enumValues || [],
    ]), [data]);

    const [createCrisis] = useMutation(
        CREATE_CRISIS,
        {
            onCompleted: (response) => {
                console.warn('create new crisis done', response);
                console.warn(response?.createCrisis?.crisis?.id);
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
        onSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    return (
        <form
            className={styles.crisisForm}
            onSubmit={onSubmit}
        >
            <TextInput
                className={styles.nameInput}
                label="Name"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
            />
            <MultiSelectInput
                options={countryOptions}
                label="Country(ies) *"
                className={styles.countryInput}
                name="countries"
                value={value.countries}
                onChange={onValueChange}
                keySelector={entryKeySelector}
                labelSelector={entryLabelSelector}
                error={error?.fields?.countries}
            />
            <SelectInput
                options={crisisTypeOptions}
                label="Crisis Type *"
                className={styles.crisisTypeInput}
                name="crisisType"
                value={value.crisisType}
                onChange={onValueChange}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                error={error?.fields?.crisisType}
            />
            <TextInput
                className={styles.crisisNarrativeInput}
                label="Crisis Narrative"
                name="crisisNarrative"
                value={value.crisisNarrative}
                onChange={onValueChange}
                error={error?.fields?.crisisNarrative}
            />
            <Button type="submit">
                Submit
            </Button>
        </form>
    );
}

export default CrisisForm;
