import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
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
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
// import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import { CrisesQueryVariables, CrisisOptionsForFilterQuery, EventOptionsForFilterQuery } from '#generated/types';

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
            name
            enumValues {
                name
                description
            }
        }
    }
`;

const EVENT_OPTIONS = gql`
    query EventOptionsForFilter {
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
        crisisTypes: [arrayCondition],
        name: [],
        events: [arrayCondition],
        /* year: [],
           createdBy: [arrayCondition], */
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    countries: [],
    crisisTypes: [],
    events: [],
    name: undefined,
    /* year: undefined,
     createdBy: [], */
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
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();

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
        loading: crisisOptionsLoading,
        error: crisisOptionsError,
    } = useQuery<CrisisOptionsForFilterQuery>(CRISIS_OPTIONS);

    const {
        data: eventData,
        loading: eventOptionsLoading,
        error: eventOptionsError,
    } = useQuery<EventOptionsForFilterQuery>(EVENT_OPTIONS);

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
                        name="name"
                        value={value.name}
                        onChange={onValueChange}
                        placeholder="Search"
                    />

                    {/*
                    (FIX: This has been added as per requirement
                         but the respective query is not updated)

                    <UserMultiSelectInput
                        options={createdByOptions}
                        label="Created By"
                        name="filterEntryCreatedBy"
                        value={value.createdBy}
                        onChange={onValueChange}
                        onOptionsChange={setCreatedByOptions}
                        error={error?.fields?.createdBy?.$internal}
                    />

                    <TextInput
                        className={styles.input}
                        icons={<IoIosSearch />}
                        label="Year"
                        name="year"
                        value={value.year}
                        onChange={onValueChange}
                        placeholder="Search"
                    /> */}
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
                    <MultiSelectInput
                        className={styles.input}
                        options={eventData?.eventType?.enumValues}
                        label="Events"
                        name="events"
                        value={value.events}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        error={error?.fields?.events?.$internal}
                        disabled={eventOptionsLoading || !!eventOptionsError}
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

export default CrisesFilter;
