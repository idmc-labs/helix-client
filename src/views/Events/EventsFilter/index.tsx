import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    PartialForm,
    PurgeNull,
    arrayCondition,
    useForm,
    ObjectSchema,
    createSubmitHandler,
} from '@togglecorp/toggle-form';
import { gql, useQuery } from '@apollo/client';

import {
    IoIosSearch,
} from 'react-icons/io';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
// import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import { EventListQueryVariables, EventOptionsForFiltersQuery } from '#generated/types';

import styles from './styles.css';
import {
    enumKeySelector,
    enumLabelSelector,
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

// eslint-disable-next-line @typescript-eslint/ban-types
type EventFilterFields = Omit<EventListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<EventFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const EVENT_OPTIONS = gql`
    query EventOptionsForFilters {
        eventType: __type(name: "CRISIS_TYPE") {
            enumValues {
                name
                description
            }
        }
    }
`;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        countries: [arrayCondition],
        eventTypes: [arrayCondition],
        crisisByIds: [arrayCondition],
        name: [],
        glideNumbers: [arrayCondition],
        /* year: [],
           createdBy: [arrayCondition], */
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    countries: [],
    crisisByIds: [],
    eventTypes: [],
    glideNumbers: [],
    name: undefined,
    /* year: undefined,
     createdBy: [], */
};

interface EventsFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<EventListQueryVariables>) => void;
    crisisSelectionDisabled: boolean;
}

function EventsFilter(props: EventsFilterProps) {
    const {
        className,
        onFilterChange,
        crisisSelectionDisabled,
    } = props;

    const [
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();

    const [
        crisisByIds,
        setCrisesByIds,
    ] = useState<CrisisOption[] | null | undefined>();

    /* const [
       createdByOptions,
       setCreatedByOptions,
     ] = useState<UserOption[] | null | undefined>();
      */

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
        loading: eventOptionsLoading,
        error: eventOptionsError,
    } = useQuery<EventOptionsForFiltersQuery>(EVENT_OPTIONS);

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
                    placeholder="Search"
                />
                <MultiSelectInput
                    className={styles.input}
                    options={data?.eventType?.enumValues}
                    label="Causes"
                    name="eventTypes"
                    value={value.eventTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.eventTypes?.$internal}
                    disabled={eventOptionsLoading || !!eventOptionsError}
                />
                {!crisisSelectionDisabled && (
                    <CrisisMultiSelectInput
                        className={styles.input}
                        options={crisisByIds}
                        label="Crises"
                        name="crisisByIds"
                        error={error?.fields?.crisisByIds?.$internal}
                        value={value.crisisByIds}
                        onChange={onValueChange}
                        // disabled={disabled}
                        onOptionsChange={setCrisesByIds}
                    />
                )}
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
                <MultiSelectInput
                    className={styles.input}
                    options={null}
                    label="Event ID"
                    name="glideNumbers"
                    value={value.glideNumbers}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    error={error?.fields?.glideNumbers?.$internal}
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

export default EventsFilter;
