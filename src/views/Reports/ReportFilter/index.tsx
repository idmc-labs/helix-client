import React, { useState, useCallback } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    IoIosSearch,
} from 'react-icons/io';

import NonFieldError from '#components/NonFieldError';

import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';

import { PartialForm, PurgeNull } from '#types';
import { ReportsQueryVariables } from '#generated/types';
import {
    arrayCondition,
} from '#utils/validation';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type ReportsFilterFields = Omit<ReportsQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<ReportsFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterFigureCountries: [arrayCondition],
        name_Icontains: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    filterFigureCountries: [],
    name_Icontains: undefined,
};

interface ReportFilterProps {
    className?: string;
    setReportsQueryFilters: React.Dispatch<React.SetStateAction<
        PurgeNull<ReportsQueryVariables> | undefined
    >>;
}

function ReportFilter(props: ReportFilterProps) {
    const {
        className,
        setReportsQueryFilters,
    } = props;

    const [
        filterFigureCountries,
        setFilterFigureCountries,
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
            setReportsQueryFilters(defaultFormValues);
        },
        [onValueSet, setReportsQueryFilters],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        setReportsQueryFilters(finalValues);
    }, [onValueSet, setReportsQueryFilters]);

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
                        name="name_Icontains"
                        value={value.name_Icontains}
                        onChange={onValueChange}
                        placeholder="Search"
                    />
                    <CountryMultiSelectInput
                        className={styles.input}
                        options={filterFigureCountries}
                        onOptionsChange={setFilterFigureCountries}
                        label="Countries"
                        name="filterFigureCountries"
                        value={value.filterFigureCountries}
                        onChange={onValueChange}
                        error={error?.fields?.filterFigureCountries?.$internal}
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

export default ReportFilter;
