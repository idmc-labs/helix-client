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
    nullCondition,
} from '@togglecorp/toggle-form';
import { gql, useQuery } from '@apollo/client';

import {
    IoIosSearch,
} from 'react-icons/io';

import Row from '#components/Row';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import TagInput from '#components/TagInput';
// import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';
import NonFieldError from '#components/NonFieldError';

import {
    EventListQueryVariables,
    EventOptionsForFiltersQuery,
    Crisis_Type as CrisisType,
} from '#generated/types';

import styles from './styles.css';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

// FIXME: the comparision should be type-safe but
// we are currently downcasting string literals to string
const conflict: CrisisType = 'CONFLICT';
const disaster: CrisisType = 'DISASTER';

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
        violenceList {
            results {
                id
                name
            }
        }
        disasterCategoryList {
            results {
                id
                name
            }
        }
    }
`;

const schema: FormSchema = {
    fields: (eventValue): FormSchemaFields => {
        const basicFields: FormSchemaFields = {
            countries: [arrayCondition],
            eventTypes: [arrayCondition],
            crisisByIds: [arrayCondition],
            name: [],
            glideNumbers: [arrayCondition],
            violenceTypes: [nullCondition],
            disasterCategories: [nullCondition],
            /* year: [],
               createdBy: [arrayCondition], */
        };
        if (eventValue?.eventTypes?.includes(conflict)) {
            return {
                ...basicFields,
                violenceTypes: [arrayCondition],
            };
        }
        if (eventValue?.eventTypes?.includes(disaster)) {
            return {
                ...basicFields,
                disasterCategories: [arrayCondition],
            };
        }
        return basicFields;
    },
};

const defaultFormValues: PartialForm<FormType> = {
    countries: [],
    crisisByIds: [],
    eventTypes: [],
    glideNumbers: [],
    name: undefined,
    violenceTypes: [],
    disasterCategories: [],
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

    const violenceOptions = data?.violenceList?.results;
    const disasterCategoryOptions = data?.disasterCategoryList?.results;
    const filterChanged = defaultFormValues !== value;

    const conflictType = value.eventTypes?.includes(conflict);
    const disasterType = value.eventTypes?.includes(disaster);

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
                <Row>
                    {conflictType && (
                        <MultiSelectInput
                            options={violenceOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence Type"
                            name="violenceTypes"
                            value={value.violenceTypes}
                            onChange={onValueChange}
                            error={error?.fields?.violenceTypes?.$internal}
                        />
                    )}
                    {disasterType && (
                        <MultiSelectInput
                            options={disasterCategoryOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Disaster Category"
                            name="disasterCategories"
                            value={value.disasterCategories}
                            onChange={onValueChange}
                            error={error?.fields?.disasterCategories?.$internal}
                        />
                    )}
                </Row>
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
                <TagInput
                    className={styles.input}
                    label="Event ID"
                    name="glideNumbers"
                    value={value.glideNumbers}
                    onChange={onValueChange}
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
