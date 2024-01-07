import React, { useCallback, useMemo, useEffect } from 'react';
import { TextInput, NumberInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    arrayCondition,
    integerCondition,
    greaterThanOrEqualToCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import {
    IoSearchOutline,
} from 'react-icons/io5';
import RegionMultiSelectInput from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput from '#components/selections/GeographicMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import { CountriesQueryVariables } from '#generated/types';
import styles from './styles.css';

type Tmp = NonNullable<CountriesQueryVariables['filters']>;

export type CountriesFilterFields = Omit<Tmp, 'aggregateFigures'> & Pick<NonNullable<Tmp['aggregateFigures']>, 'year'>;
type FormType = PurgeNull<PartialForm<CountriesFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const createSchema = (yearFilterHidden: boolean | undefined): FormSchema => ({
    fields: (): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
            regionByIds: [arrayCondition],
            geoGroupByIds: [arrayCondition],
            countryName: [],
        };
        if (!yearFilterHidden) {
            basicFields = {
                ...basicFields,
                year: [integerCondition, greaterThanOrEqualToCondition(2000)],
            };
        }
        return basicFields;
    },
});

interface CountriesFiltersProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;

    hiddenFields?: ('year')[];
}

function CountriesFilter(props: CountriesFiltersProps) {
    const {
        className,
        initialFilter,
        onFilterChange,
        hiddenFields = [],
    } = props;

    const yearFilterHidden = hiddenFields.includes('year');

    const schema = useMemo(
        () => createSchema(yearFilterHidden),
        [yearFilterHidden],
    );

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(initialFilter, schema);
    // NOTE: Set the form value when initialFilter is changed on parent
    useEffect(
        () => {
            onValueSet(initialFilter);
        },
        [initialFilter, onValueSet],
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
                    label="Name"
                    name="countryName"
                    value={value.countryName}
                    onChange={onValueChange}
                    placeholder="Search"
                    error={error?.fields?.countryName}
                />
                <RegionMultiSelectInput
                    className={styles.input}
                    label="Regions"
                    name="regionByIds"
                    value={value.regionByIds}
                    onChange={onValueChange}
                    error={error?.fields?.regionByIds?.$internal}
                />
                <GeographicMultiSelectInput
                    className={styles.input}
                    label="Geographical Groups"
                    name="geoGroupByIds"
                    value={value.geoGroupByIds}
                    onChange={onValueChange}
                    error={error?.fields?.geoGroupByIds?.$internal}
                />
                {!yearFilterHidden && (
                    <NumberInput
                        className={styles.input}
                        type="number"
                        label="Year"
                        name="year"
                        value={value.year}
                        onChange={onValueChange}
                        error={error?.fields?.year}
                    />
                )}
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

export default CountriesFilter;
