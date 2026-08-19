import React, { useCallback, useEffect } from 'react';
import {
    Button,
    TextInput,
    NumberInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import { IoSearchOutline } from 'react-icons/io5';

import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import {
    HouseholdSizeListQueryVariables,
} from '#generated/types';

import styles from './styles.module.css';

type HouseholdSizeFilterFields = NonNullable<HouseholdSizeListQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<HouseholdSizeFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        search: [],
        year: [],
        countries: [],
    }),
};

interface HouseholdSizeFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
    onFilterReset: () => void;
    orderingOrPageChanged?: boolean;
}

function HouseholdSizeRecordsFilter(props: HouseholdSizeFilterProps) {
    const {
        className,
        initialFilter,
        currentFilter,
        onFilterChange,
        onFilterReset,
        orderingOrPageChanged = false,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(currentFilter, schema);

    // NOTE: Set the form value when initialFilter and currentFilter is changed on parent
    // We cannot only use initialFilter as it will change the form value when
    // currentFilter != initialFilter on mount
    useEffect(
        () => {
            if (initialFilter === currentFilter) {
                onValueSet(initialFilter);
            }
        },
        [currentFilter, initialFilter, onValueSet],
    );

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFilter);
            onFilterReset();
        },
        [onValueSet, onFilterReset, initialFilter],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

    const filterChanged = initialFilter !== value;

    return (
        <form
            className={_cs(className, styles.queryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.contentContainer}>
                <TextInput
                    className={styles.input}
                    name="search"
                    label="Search"
                    value={value.search}
                    error={error?.fields?.search}
                    onChange={onValueChange}
                    icons={<IoSearchOutline />}
                    placeholder="Search by country, source or notes"
                />
                <CountryMultiSelectInput
                    label="Countries"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries?.$internal}
                />
                <NumberInput
                    className={styles.input}
                    name="year"
                    label="Year"
                    value={value.year}
                    error={error?.fields?.year}
                    onChange={onValueChange}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset Filters"
                        disabled={!filterChanged && !orderingOrPageChanged}
                    >
                        Reset
                    </Button>
                    <Button
                        name={undefined}
                        type="submit"
                        title="Apply"
                        disabled={pristine}
                        variant="primary"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default HouseholdSizeRecordsFilter;
