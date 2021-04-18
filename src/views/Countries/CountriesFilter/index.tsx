import React, { useState, useCallback } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    IoIosSearch,
} from 'react-icons/io';
import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput, { GeographicOption } from '#components/selections/GeographicMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';

import { PartialForm, PurgeNull } from '#types';
import { CountriesQueryVariables } from '#generated/types';
import {
    arrayCondition,
} from '#utils/validation';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type CountriesFilterFields = Omit<CountriesQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<CountriesFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        regionByIds: [arrayCondition],
        geoGroupsByIds: [arrayCondition],
        countryName: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    regionByIds: [],
    geoGroupsByIds: [],
    countryName: undefined,
};

interface CountriesFiltersProps {
    className?: string;
    setCountriesQueryFilters: React.Dispatch<React.SetStateAction<
        PurgeNull<CountriesQueryVariables> | undefined
    >>;
}

function CountriesFilter(props: CountriesFiltersProps) {
    const {
        className,
        setCountriesQueryFilters,
    } = props;

    const [
        regionByIds,
        setRegions,
    ] = useState<RegionOption[] | null | undefined>();
    const [
        geoGroupsByIds,
        setGeographicGroups,
    ] = useState<GeographicOption[] | null | undefined>();

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
            setCountriesQueryFilters(defaultFormValues);
        },
        [onValueSet, setCountriesQueryFilters],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        setCountriesQueryFilters(finalValues);
    }, [onValueSet, setCountriesQueryFilters]);

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
                        name="countryName"
                        value={value.countryName}
                        onChange={onValueChange}
                        placeholder="Search"
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

export default CountriesFilter;
