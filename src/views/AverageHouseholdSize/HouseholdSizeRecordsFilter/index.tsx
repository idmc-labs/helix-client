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
        filterAhhsDataSourceCategory: [],
        filterAhhsSize: [],
        filterAhhsSource: [],
        filterIdmcReportingYear: [],
    }),
};

interface HouseholdSizeFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
}

function HouseholdSizeRecordsFilter(props: HouseholdSizeFilterProps) {
    const {
        className,
        initialFilter,
        currentFilter,
        onFilterChange,
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
            onFilterChange(initialFilter);
        },
        [onValueSet, onFilterChange, initialFilter],
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
                    icons={<IoSearchOutline />}
                    label="Country"
                    name="search"
                    value={value.search}
                    onChange={onValueChange}
                    placeholder="Search by country name"
                />
                <NumberInput
                    className={styles.input}
                    label="Year"
                    name="filterIdmcReportingYear"
                    value={value.filterIdmcReportingYear}
                    onChange={onValueChange}
                />
                <NumberInput
                    className={styles.input}
                    label="Average Household Size (AHHS)"
                    name="filterAhhsSize"
                    value={value.filterAhhsSize}
                    onChange={onValueChange}
                />
                <TextInput
                    className={styles.input}
                    label="Source"
                    name="filterAhhsSource"
                    value={value.filterAhhsSource}
                    onChange={onValueChange}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset Filters"
                        disabled={!filterChanged}
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
