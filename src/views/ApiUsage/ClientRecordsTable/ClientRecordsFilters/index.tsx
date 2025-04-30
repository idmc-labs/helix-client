import React, { useCallback, useEffect } from 'react';
import {
    Button,
    MultiSelectInput,
    TextInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    PartialForm,
    PurgeNull,
    arrayCondition,
} from '@togglecorp/toggle-form';
import { IoSearchOutline } from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import BooleanInput from '#components/selections/BooleanInput';
import {
    ClientListQueryVariables,
    ClientUseCaseOptionsQuery,
    ClientUseCaseOptionsQueryVariables,
} from '#generated/types';
import { enumKeySelector, enumLabelSelector, GetEnumOptions } from '#utils/common';

import styles from './styles.module.css';

const CLIENT_USE_CASE_OPTIONS = gql`
    query ClientUseCaseOptions {
        useCaseTypes: __type(name: "USE_CASE_TYPES") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

type ClientFilterFields = NonNullable<ClientListQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<ClientFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        isActive: [],
        name: [],
        useCases: [arrayCondition],
    }),
};

interface ClientFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
}

function ClientRecordsFilter(props: ClientFilterProps) {
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

    const {
        data: options,
        loading: optionsLoading,
        error: optionsError,
    } = useQuery<
        ClientUseCaseOptionsQuery,
        ClientUseCaseOptionsQueryVariables
    >(CLIENT_USE_CASE_OPTIONS);

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

    const useCaseTypes = options?.useCaseTypes?.enumValues;
    type UseCaseTypeOptions = GetEnumOptions<
        typeof useCaseTypes,
        NonNullable<typeof value.useCases>[number]
    >;

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
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    placeholder="Search by name, acronym, contact name or contact email"
                />
                <BooleanInput
                    className={styles.input}
                    label="Active"
                    name="isActive"
                    error={error?.fields?.isActive}
                    value={value.isActive}
                    onChange={onValueChange}
                />
                <MultiSelectInput
                    label="Use Cases"
                    name="useCases"
                    options={useCaseTypes as UseCaseTypeOptions}
                    value={value.useCases}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.useCases?.$internal}
                    disabled={optionsLoading || !!optionsError}
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

export default ClientRecordsFilter;
