import React, { useCallback, useEffect } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
} from '@togglecorp/toggle-form';

import {
    IoSearchOutline,
} from 'react-icons/io5';
import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';

import { PartialForm, PurgeNull } from '#types';
import { ContactListQueryVariables } from '#generated/types';
import styles from './styles.module.css';

type ContactsFilterFields = NonNullable<ContactListQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<ContactsFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        search: [],
        countriesOfOperation: [],
    }),
};

interface ContactsFilterProps {
    className?: string;
    currentFilter: PartialForm<FormType>;
    initialFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
    onFilterReset: () => void;
    orderingOrPageChanged?: boolean;
}

function ContactsFilter(props: ContactsFilterProps) {
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
                    icons={<IoSearchOutline />}
                    label="Search"
                    name="search"
                    value={value.search}
                    onChange={onValueChange}
                    error={error?.fields?.search}
                />
                <CountryMultiSelectInput
                    className={styles.input}
                    label="Countries of Operation"
                    name="countriesOfOperation"
                    value={value.countriesOfOperation}
                    onChange={onValueChange}
                    error={error?.fields?.countriesOfOperation?.$internal}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset"
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

export default ContactsFilter;
