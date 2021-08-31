import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
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

import Row from '#components/Row';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
// import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';

import NonFieldError from '#components/NonFieldError';

import { EventListQueryVariables, EventOptionsForFiltersQuery } from '#generated/types';

import styles from './styles.css';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
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
            glideNumber_Icontains: [],
            violenceTypes: [nullCondition],
            disasterCategories: [nullCondition],
            /* year: [],
               createdBy: [arrayCondition], */
        };
        if (eventValue?.eventTypes?.includes('CONFLICT')) {
            return {
                ...basicFields,
                violenceTypes: [],
            };
        }
        if (eventValue?.eventTypes?.includes('DISASTER')) {
            return {
                ...basicFields,
                disasterCategories: [],
            };
        }
        return basicFields;
    },
};

const defaultFormValues: PartialForm<FormType> = {
    countries: [],
    crisisByIds: [],
    eventTypes: [],
    glideNumber_Icontains: undefined,
    name: undefined,
    violenceTypes: [],
    disasterCategories: [],
    /* year: undefined,
     createdBy: [], */
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
    const filterChanged = defaultFormValues !== value;

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

    const conflictType = value.eventTypes?.includes('CONFLICT');
    const disasterType = value.eventTypes?.includes('DISASTER');

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
                            options={disasterSubTypeOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Disaster Category"
                            name="disasterCategories"
                            value={value.disasterCategories}
                            onChange={onValueChange}
                            error={error?.fields?.disasterCategories?.$internal}
                            groupLabelSelector={otherGroupLabelSelector}
                            groupKeySelector={otherGroupKeySelector}
                            grouped
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
                <TextInput
                    className={styles.input}
                    label="Event ID"
                    name="glideNumber_Icontains"
                    value={value.glideNumber_Icontains}
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
