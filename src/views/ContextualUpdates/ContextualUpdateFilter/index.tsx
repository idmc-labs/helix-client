import React, { useCallback, useEffect } from 'react';
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

interface ContextualFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
}

function ContextualFilter(props: ContextualFilterProps) {
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
