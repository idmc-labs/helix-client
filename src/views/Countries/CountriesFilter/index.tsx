import React, { useState, useCallback, useMemo } from 'react';
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
    IoIosSearch,
} from 'react-icons/io';
import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput, { GeographicOption } from '#components/selections/GeographicMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import { CountriesQueryVariables } from '#generated/types';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type CountriesFilterFields = Omit<CountriesQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<CountriesFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const createSchema = (yearFilterHidden: boolean | undefined): FormSchema => ({
    fields: (): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
            regionByIds: [arrayCondition],
            geoGroupsByIds: [arrayCondition],
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

const defaultFormValues: PartialForm<FormType> = {
    regionByIds: [],
    geoGroupsByIds: [],
    countryName: undefined,
    year: new Date().getFullYear(),
};

interface CountriesFiltersProps {
    className?: string;
    yearFilterHidden?: boolean;
    onFilterChange: (value: PurgeNull<CountriesQueryVariables>) => void;
}

function CountriesFilter(props: CountriesFiltersProps) {
    const {
        className,
        onFilterChange,
        yearFilterHidden,
    } = props;

    const [
        regionByIds,
        setRegions,
    ] = useState<RegionOption[] | null | undefined>();
    const [
        geoGroupsByIds,
        setGeographicGroups,
    ] = useState<GeographicOption[] | null | undefined>();

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
    } = useForm(defaultFormValues, schema);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

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
                <TextInput
                    className={styles.input}
                    icons={<IoIosSearch />}
                    label="Name"
                    name="countryName"
                    value={value.countryName}
                    onChange={onValueChange}
                    placeholder="Search"
                    error={error?.fields?.countryName}
                />
                <RegionMultiSelectInput
                    className={styles.input}
                    options={regionByIds}
                    onOptionsChange={setRegions}
                    label="Regions"
                    name="regionByIds"
                    value={value.regionByIds}
                    onChange={onValueChange}
                    error={error?.fields?.regionByIds?.$internal}
                />
                <GeographicMultiSelectInput
                    className={styles.input}
                    options={geoGroupsByIds}
                    onOptionsChange={setGeographicGroups}
                    label="Geographical Groups"
                    name="geoGroupsByIds"
                    value={value.geoGroupsByIds}
                    onChange={onValueChange}
                    error={error?.fields?.geoGroupsByIds?.$internal}
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
