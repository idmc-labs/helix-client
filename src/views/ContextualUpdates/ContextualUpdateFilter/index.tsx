import React, { useCallback } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    arrayCondition,
} from '@togglecorp/toggle-form';

import {
    IoSearchOutline,
} from 'react-icons/io5';
import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import OrganizationMultiSelectInput from '#components/selections/OrganizationMultiSelectInput';

import { PartialForm, PurgeNull } from '#types';
import { ContextualUpdatesQueryVariables } from '#generated/types';
import styles from './styles.css';

type ContextualFilterFields = NonNullable<ContextualUpdatesQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<ContextualFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        articleTitle: [],
        countries: [arrayCondition],
        publishers: [arrayCondition],
        sources: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    articleTitle: undefined,
    countries: [],
    publishers: [],
    sources: [],
};

interface ContextualFilterProps {
    className?: string;
    initialFilter?: PartialForm<FormType>;
    onFilterChange: (value: PurgeNull<ContextualFilterFields>) => void;
}

function ContextualFilter(props: ContextualFilterProps) {
    const {
        className,
        initialFilter,
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
    } = useForm(initialFilter ?? defaultFormValues, schema);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
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
                    icons={<IoSearchOutline />}
                    label="Search"
                    name="articleTitle"
                    value={value.articleTitle}
                    onChange={onValueChange}
                    error={error?.fields?.articleTitle}
                />
                <CountryMultiSelectInput
                    className={styles.input}
                    label="Countries"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries?.$internal}
                />
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Publishers"
                    name="publishers"
                    onChange={onValueChange}
                    value={value.publishers}
                    error={error?.fields?.publishers?.$internal}
                />
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Sources"
                    name="sources"
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
