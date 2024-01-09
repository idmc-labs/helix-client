import React, { useCallback, useEffect } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    IoSearchOutline,
} from 'react-icons/io5';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    ParkedItemOptionsQuery,
    ParkedItemListQueryVariables,
} from '#generated/types';
import NonFieldError from '#components/NonFieldError';

import UserMultiSelectInput from '#components/selections/UserMultiSelectInput';
import { PartialForm, PurgeNull } from '#types';
import styles from './styles.css';

const PARKING_LOT_OPTIONS = gql`
    query ParkedItemOptions {
        status: __type(name: "PARKING_LOT_STATUS") {
            enumValues {
                name
                description
            }
        }
    }
`;

type ParkedItemFilterFields = NonNullable<ParkedItemListQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<ParkedItemFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        title_Unaccent_Icontains: [],
        statusIn: [],
        assignedToIn: [],
    }),
};

interface ParkedItemFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;

    assignedUser?: string;
    status?: string;
}

function ParkedItemFilter(props: ParkedItemFilterProps) {
    const {
        className,
        initialFilter,
        currentFilter,
        onFilterChange,

        assignedUser,
        status,
    } = props;

    const {
        data: parkedItemOptions,
        loading: parkedItemOptionsLoading,
        error: parkedItemOptionsError,
    } = useQuery<ParkedItemOptionsQuery>(PARKING_LOT_OPTIONS);

    const statusOptions = parkedItemOptions?.status?.enumValues;

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
                    name="title_Unaccent_Icontains"
                    value={value.title_Unaccent_Icontains}
                    onChange={onValueChange}
                    error={error?.fields?.title_Unaccent_Icontains}
                />
                {!assignedUser && (
                    <UserMultiSelectInput
                        className={styles.input}
                        label="Assignee"
                        name="assignedToIn"
                        onChange={onValueChange}
                        value={value.assignedToIn}
                        error={error?.fields?.assignedToIn?.$internal}
                    />
                )}
                {!status && (
                    <MultiSelectInput
                        className={styles.input}
                        label="Status"
                        name="statusIn"
                        options={statusOptions}
                        value={value.statusIn}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        onChange={onValueChange}
                        error={error?.fields?.statusIn?.$internal}
                        disabled={parkedItemOptionsLoading || !!parkedItemOptionsError}
                    />
                )}
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

export default ParkedItemFilter;
