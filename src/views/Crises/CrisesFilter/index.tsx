import React, { useState, useCallback } from 'react';
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
    IoIosSearch,
} from 'react-icons/io';

import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import { CrisesQueryVariables, CrisisOptionsForFilterQuery } from '#generated/types';

import styles from './styles.css';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

// eslint-disable-next-line @typescript-eslint/ban-types
type CrisesFilterFields = Omit<CrisesQueryVariables, 'ordering' | 'page' | 'pageSize'>;
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

const defaultFormValues: PartialForm<FormType> = {
    crisisTypes: [],
    events: [],
    name: undefined,
    createdByIds: [],
    startDate_Gte: undefined,
    endDate_Lte: undefined,
};

interface CrisesFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<CrisesQueryVariables>) => void;
}

function CrisesFilter(props: CrisesFilterProps) {
    const {
        className,
        onFilterChange,
    } = props;

    const [
        createdByOptions,
        setCreatedByOptions,
    ] = useState<UserOption[] | null | undefined>();

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

    const {
        data,
        loading: crisisOptionsLoading,
        error: crisisOptionsError,
    } = useQuery<CrisisOptionsForFilterQuery>(CRISIS_OPTIONS);

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
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    placeholder="Search by name/event name"
                />
                <UserMultiSelectInput
                    className={styles.input}
                    options={createdByOptions}
                    label="Created By"
                    name="createdByIds"
                    value={value.createdByIds}
                    onChange={onValueChange}
                    onOptionsChange={setCreatedByOptions}
                    error={error?.fields?.createdByIds?.$internal}
                />
                <DateRangeDualInput
                    className={styles.input}
                    label="Date Range"
                    fromName="startDate_Gte"
                    toName="endDate_Lte"
                    toValue={value.endDate_Lte}
                    fromValue={value.startDate_Gte}
                    fromOnChange={onValueChange}
                    toOnChange={onValueChange}
                    fromError={error?.fields?.startDate_Gte}
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

export default CrisesFilter;
