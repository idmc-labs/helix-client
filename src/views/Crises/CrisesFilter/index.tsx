import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';

import {
    IoIosSearch,
} from 'react-icons/io';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';

import { PartialForm, PurgeNull } from '#types';
import { CrisesQueryVariables, CrisisOptionsForFilterQuery } from '#generated/types';
import {
    arrayCondition,
} from '#utils/validation';
import styles from './styles.css';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

// eslint-disable-next-line @typescript-eslint/ban-types
type CrisesFilterFields = Omit<CrisesQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<CrisesFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const CRISIS_OPTIONS = gql`
    query CrisisOptionsForFilter {
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        countries: [arrayCondition],
        crisisTypes: [arrayCondition],
        name: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    countries: [],
    crisisTypes: [],
    name: undefined,
};

interface CrisesFilterProps {
    className?: string;
    setCrisesQueryFilters: React.Dispatch<React.SetStateAction<
        PurgeNull<CrisesQueryVariables> | undefined
    >>;
}

function CrisesFilter(props: CrisesFilterProps) {
    const {
        className,
        setCrisesQueryFilters,
    } = props;

    const [
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            setCrisesQueryFilters(defaultFormValues);
        },
        [onValueSet, setCrisesQueryFilters],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        setCrisesQueryFilters(finalValues);
    }, [onValueSet, setCrisesQueryFilters]);

    const {
        data,
        loading: crisisOptionsLoading,
        error: crisisOptionsError,
    } = useQuery<CrisisOptionsForFilterQuery>(CRISIS_OPTIONS);

    const filterChanged = defaultFormValues !== value;

    return (
        <form
            className={_cs(className, styles.queryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.contentContainer}>
                <div className={styles.inputContainer}>
                    <TextInput
                        className={styles.input}
                        icons={<IoIosSearch />}
                        label="Name"
                        name="name"
                        value={value.name}
                        onChange={onValueChange}
                        placeholder="Search"
                    />
                    <MultiSelectInput
                        className={styles.input}
                        options={data?.crisisType?.enumValues}
                        label="Causes"
                        name="crisisTypes"
                        value={value.crisisTypes}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        error={error?.fields?.crisisTypes?.$internal}
                        disabled={crisisOptionsLoading || !!crisisOptionsError}
                    />
                    <CountryMultiSelectInput
                        className={styles.input}
                        options={countries}
                        onOptionsChange={setCountries}
                        label="Countries"
                        name="countries"
                        value={value.countries}
                        onChange={onValueChange}
                        error={error?.fields?.countries?.$internal}
                    />
                </div>
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset Filters"
                        disabled={!filterChanged}
                        className={styles.button}
                    >
                        Reset
                    </Button>
                    <Button
                        name={undefined}
                        type="submit"
                        title="Apply"
                        disabled={pristine}
                        className={styles.button}
                        variant="primary"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default CrisesFilter;
