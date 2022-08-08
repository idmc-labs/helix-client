import React, { useCallback, useState } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    arrayCondition,
} from '@togglecorp/toggle-form';

import {
    IoIosSearch,
} from 'react-icons/io';
import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';

import { PartialForm, PurgeNull } from '#types';
import { ContextualUpdatesQueryVariables } from '#generated/types';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type ContextualFilterFields = Omit<ContextualUpdatesQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<ContextualFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        name: [],
        countries: [arrayCondition],
        publishers: [arrayCondition],
        sources: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    name: undefined,
    countries: [],
    publishers: [],
    sources: [],
};

interface ContextualFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<ContextualUpdatesQueryVariables>) => void;
}

function ContextualFilter(props: ContextualFilterProps) {
    const {
        className,
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
    } = useForm(defaultFormValues, schema);

    const [
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();

    const [
        sourceOptions,
        setSources,
    ] = useState<OrganizationOption[] | undefined | null>();

    const [
        publisherOptions,
        setPublishers,
    ] = useState<OrganizationOption[] | undefined | null>();

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
                    label="Search"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
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
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Publishers"
                    options={publisherOptions}
                    name="publishers"
                    onOptionsChange={setPublishers}
                    onChange={onValueChange}
                    value={value.publishers}
                    error={error?.fields?.publishers?.$internal}
                />
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Sources"
                    options={sourceOptions}
                    name="sources"
                    onOptionsChange={setSources}
                    onChange={onValueChange}
                    value={value.sources}
                    error={error?.fields?.sources?.$internal}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset"
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

export default ContextualFilter;
