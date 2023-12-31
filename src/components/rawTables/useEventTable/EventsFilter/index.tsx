import React, { useCallback } from 'react';
import {
    TextInput,
    Button,
    MultiSelectInput,
    DateRangeDualInput,
} from '@togglecorp/toggle-ui';
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
    IoSearchOutline,
} from 'react-icons/io5';

import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput from '#components/selections/CrisisMultiSelectInput';
import UserMultiSelectInput from '#components/selections/UserMultiSelectInput';
import ViolenceContextMultiSelectInput from '#components/selections/ViolenceContextMultiSelectInput';
import NonFieldError from '#components/NonFieldError';

import {
    EventListQueryVariables,
    EventOptionsForFiltersQuery,
    Crisis_Type as CrisisType,
    Event_Review_Status as EventReviewStatus,
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

type EventFilterFields = NonNullable<EventListQueryVariables['filters']>;
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
        eventType: __type(name: "CRISIS_TYPE") {
            enumValues {
                name
                description
            }
        }
        eventReviewStatus: __type(name: "EVENT_REVIEW_STATUS") {
            enumValues {
                name
                description
            }
        }
        violenceList {
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
        contextOfViolenceList {
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
        let basicFields: FormSchemaFields = {
            countries: [arrayCondition],
            eventTypes: [arrayCondition],
            reviewStatus: [arrayCondition],
            crisisByIds: [arrayCondition],
            name: [],
            createdByIds: [arrayCondition],
            startDate_Gte: [],
            endDate_Lte: [],

            violenceSubTypes: [nullCondition, arrayCondition],
            contextOfViolences: [nullCondition, arrayCondition],
            disasterSubTypes: [nullCondition, arrayCondition],
        };
        if (eventValue?.eventTypes?.includes(conflict)) {
            basicFields = {
                ...basicFields,
                violenceSubTypes: [arrayCondition],
                contextOfViolences: [],
            };
        }
        if (eventValue?.eventTypes?.includes(disaster)) {
            basicFields = {
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
    reviewStatus: [],
    name: undefined,
    violenceSubTypes: [],
    contextOfViolences: [],
    disasterSubTypes: [],
};
interface ViolenceOption {
    violenceTypeId: string;
    violenceTypeName: string;
}
const violenceGroupKeySelector = (item: ViolenceOption) => (
    item.violenceTypeId
);
const violenceGroupLabelSelector = (item: ViolenceOption) => (
    item.violenceTypeName
);

interface DisasterOption {
    disasterTypeId: string;
    disasterTypeName: string;
    disasterSubCategoryId: string;
    disasterSubCategoryName: string;
    disasterCategoryId: string;
    disasterCategoryName: string;
}
const disasterGroupKeySelector = (item: DisasterOption) => (
    `${item.disasterCategoryId}-${item.disasterSubCategoryId}-${item.disasterTypeId}`
);
const disasterGroupLabelSelector = (item: DisasterOption) => (
    `${item.disasterCategoryName} › ${item.disasterSubCategoryName} › ${item.disasterTypeName}`
);

interface EventsFilterProps {
    className?: string;
    initialFilter?: PartialForm<FormType>;
    onFilterChange: (value: PurgeNull<EventFilterFields>) => void;

    hiddenFields?: ('createdBy' | 'crisis' | 'countries' | 'reviewStatus')[];
    // We use these props to filter out other options
    countries?: string[];
    crises?: string[];
}

function EventsFilter(props: EventsFilterProps) {
    const {
        className,
        initialFilter,
        onFilterChange,

        hiddenFields = [],
        countries,
        crises,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(initialFilter ?? defaultFormValues, schema);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

    const {
        data,
        loading: eventOptionsLoading,
        error: eventOptionsError,
    } = useQuery<EventOptionsForFiltersQuery>(EVENT_OPTIONS);

    const violenceOptions = data?.violenceList?.results?.flatMap((violenceType) => (
        violenceType.subTypes?.results?.map((violenceSubType) => ({
            ...violenceSubType,
            violenceTypeId: violenceType.id,
            violenceTypeName: violenceType.name,
        }))
    )).filter(isDefined);

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

    const ApprovedButChanged: EventReviewStatus = 'APPROVED_BUT_CHANGED';
    const SignedoffButChanged: EventReviewStatus = 'SIGNED_OFF_BUT_CHANGED';
    const eventReviewStatusOptions = data?.eventReviewStatus?.enumValues
        ?.filter((item) => item.name !== ApprovedButChanged && item.name !== SignedoffButChanged);

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
                    icons={<IoSearchOutline />}
                    label="Name"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    placeholder="Search by event name"
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
                {!hiddenFields.includes('reviewStatus') && (
                    <MultiSelectInput
                        className={styles.input}
                        options={eventReviewStatusOptions}
                        label="Review Status"
                        name="reviewStatus"
                        value={value.reviewStatus}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        error={error?.fields?.reviewStatus?.$internal}
                        disabled={eventOptionsLoading || !!eventOptionsError}
                    />
                )}
                {conflictType && (
                    <>
                        <MultiSelectInput
                            className={styles.input}
                            options={violenceOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence Types"
                            name="violenceSubTypes"
                            value={value.violenceSubTypes}
                            onChange={onValueChange}
                            error={error?.fields?.violenceSubTypes?.$internal}
                            groupLabelSelector={violenceGroupLabelSelector}
                            groupKeySelector={violenceGroupKeySelector}
                            grouped
                        />
                        <ViolenceContextMultiSelectInput
                            className={styles.input}
                            label="Context of Violence"
                            name="contextOfViolences"
                            value={value.contextOfViolences}
                            onChange={onValueChange}
                            error={error?.fields?.contextOfViolences?.$internal}
                        />
                    </>
                )}
                {disasterType && (
                    <MultiSelectInput
                        className={styles.input}
                        options={disasterSubTypeOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Hazard Types"
                        name="disasterSubTypes"
                        value={value.disasterSubTypes}
                        onChange={onValueChange}
                        error={error?.fields?.disasterSubTypes?.$internal}
                        groupLabelSelector={disasterGroupLabelSelector}
                        groupKeySelector={disasterGroupKeySelector}
                        grouped
                    />
                )}
                {!hiddenFields.includes('reviewStatus') && (
                    <MultiSelectInput
                        className={styles.input}
                        options={data?.eventReviewStatus?.enumValues}
                        label="Review Status"
                        name="reviewStatus"
                        value={value.reviewStatus}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        error={error?.fields?.reviewStatus?.$internal}
                        disabled={eventOptionsLoading || !!eventOptionsError}
                    />
                )}
                {!hiddenFields.includes('crisis') && (
                    <CrisisMultiSelectInput
                        className={styles.input}
                        label="Crises"
                        name="crisisByIds"
                        error={error?.fields?.crisisByIds?.$internal}
                        value={value.crisisByIds}
                        onChange={onValueChange}
                        // disabled={disabled}
                        countries={countries}
                    />
                )}
                {!hiddenFields.includes('countries') && (
                    <CountryMultiSelectInput
                        className={styles.input}
                        label="Countries"
                        name="countries"
                        value={value.countries}
                        onChange={onValueChange}
                        error={error?.fields?.countries?.$internal}
                        crises={crises}
                    />
                )}
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

export default EventsFilter;
