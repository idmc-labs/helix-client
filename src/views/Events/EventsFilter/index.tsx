import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput, DateInput } from '@togglecorp/toggle-ui';
import { _cs, isDefined } from '@togglecorp/fujs';
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

import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import TagInput from '#components/TagInput';
import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';
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

// FIXME: the comparison should be type-safe but
// we are currently down-casting string literals to string
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
                subCategories {
                    results {
                        id
                        name
                        types {
                            results {
                                id
                                name
                                subTypes {
                                    results {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
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
            disasterSubTypes: [nullCondition],
            createdByIds: [arrayCondition],
            startDate_Gte: [],
            endDate_Lte: [],
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
                disasterSubTypes: [arrayCondition],
            };
        }
        return basicFields;
    },
};

const defaultFormValues: PartialForm<FormType> = {
    crisisByIds: [],
    eventTypes: [],
    glideNumbers: [],
    name: undefined,
    violenceTypes: [],
    disasterSubTypes: [],
    createdByIds: [],
};

interface WithOtherGroup {
    disasterTypeId: string;
    disasterTypeName: string;
    disasterSubCategoryId: string;
    disasterSubCategoryName: string;
    disasterCategoryId: string;
    disasterCategoryName: string;
}
const otherGroupKeySelector = (item: WithOtherGroup) => (
    `${item.disasterCategoryId}-${item.disasterSubCategoryId}-${item.disasterTypeId}`
);
const otherGroupLabelSelector = (item: WithOtherGroup) => (
    `${item.disasterCategoryName} › ${item.disasterSubCategoryName} › ${item.disasterTypeName}`
);

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
        crisisByIds,
        setCrisesByIds,
    ] = useState<CrisisOption[] | null | undefined>();

    const [
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();

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
        loading: eventOptionsLoading,
        error: eventOptionsError,
    } = useQuery<EventOptionsForFiltersQuery>(EVENT_OPTIONS);

    const violenceOptions = data?.violenceList?.results;

    // eslint-disable-next-line max-len
    const disasterSubTypeOptions = data?.disasterCategoryList?.results?.flatMap((disasterCategory) => (
        disasterCategory.subCategories?.results?.flatMap((disasterSubCategory) => (
            disasterSubCategory.types?.results?.flatMap((disasterType) => (
                disasterType.subTypes?.results?.map((disasterSubType) => ({
                    ...disasterSubType,
                    disasterTypeId: disasterType.id,
                    disasterTypeName: disasterType.name,
                    disasterSubCategoryId: disasterSubCategory.id,
                    disasterSubCategoryName: disasterSubCategory.name,
                    disasterCategoryId: disasterCategory.id,
                    disasterCategoryName: disasterCategory.name,
                }))
            ))
        ))
    )).filter(isDefined);

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
                <DateInput
                    className={styles.input}
                    label="Start Date"
                    value={value.startDate_Gte}
                    onChange={onValueChange}
                    name="startDate_Gte"
                    error={error?.fields?.startDate_Gte}
                />
                <DateInput
                    className={styles.input}
                    label="End Date"
                    value={value.endDate_Lte}
                    onChange={onValueChange}
                    name="endDate_Lte"
                    error={error?.fields?.endDate_Lte}
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
                {conflictType && (
                    <MultiSelectInput
                        className={styles.input}
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
                        className={styles.input}
                        options={disasterSubTypeOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Disaster Category"
                        name="disasterSubTypes"
                        value={value.disasterSubTypes}
                        onChange={onValueChange}
                        error={error?.fields?.disasterSubTypes?.$internal}
                        groupLabelSelector={otherGroupLabelSelector}
                        groupKeySelector={otherGroupKeySelector}
                        grouped
                    />
                )}
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
                    label="Event Codes"
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
