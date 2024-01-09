import React, { useCallback, useEffect } from 'react';
import {
    TextInput,
    Button,
    MultiSelectInput,
    DateRangeDualInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    arrayCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import { gql, useQuery } from '@apollo/client';

import {
    IoSearchOutline,
} from 'react-icons/io5';

import UserMultiSelectInput from '#components/selections/UserMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import { CrisesQueryVariables, CrisisOptionsForFilterQuery } from '#generated/types';

import styles from './styles.css';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

type CrisesFilterFields = NonNullable<CrisesQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<CrisesFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const CRISIS_OPTIONS = gql`
    query CrisisOptionsForFilter {
        crisisType: __type(name: "CRISIS_TYPE") {
            enumValues {
                name
                description
            }
        }
    }
`;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        crisisTypes: [arrayCondition],
        name: [],
        events: [arrayCondition],
        createdByIds: [arrayCondition],
        startDate_Gte: [],
        endDate_Lte: [],
    }),
};

interface CrisesFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
    hiddenFields?: ('createdBy')[];
}

function CrisesFilter(props: CrisesFilterProps) {
    const {
        className,
        initialFilter,
        currentFilter,
        onFilterChange,
        hiddenFields = [],
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

    const {
        data,
        loading: crisisOptionsLoading,
        error: crisisOptionsError,
    } = useQuery<CrisisOptionsForFilterQuery>(CRISIS_OPTIONS);

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
                    placeholder="Search by name/event name"
                />
                {!hiddenFields.includes('createdBy') && (
                    <UserMultiSelectInput
                        className={styles.input}
                        label="Created By"
                        name="createdByIds"
                        value={value.createdByIds}
                        onChange={onValueChange}
                        error={error?.fields?.createdByIds?.$internal}
                    />
                )}
                <DateRangeDualInput
                    className={styles.input}
                    label="Date Range"
                    fromName="startDate_Gte"
                    fromValue={value.startDate_Gte}
                    fromOnChange={onValueChange}
                    fromError={error?.fields?.startDate_Gte}
                    toName="endDate_Lte"
                    toValue={value.endDate_Lte}
                    toOnChange={onValueChange}
                    toError={error?.fields?.endDate_Lte}
                />
                <MultiSelectInput
                    className={styles.input}
                    options={data?.crisisType?.enumValues}
                    label="Causes"
                    name="crisisTypes"
                    value={value.crisisTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.crisisTypes?.$internal}
                    disabled={crisisOptionsLoading || !!crisisOptionsError}
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

export default CrisesFilter;
