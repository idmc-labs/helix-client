import React, { useState, useContext, useCallback, useMemo } from 'react';
import { _cs, isDefined, randomString, isNotDefined } from '@togglecorp/fujs';
import {
    TextInput,
    SelectInput,
    Button,
    Modal,
    DateInput,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    requiredListCondition,
    requiredStringCondition,
    idCondition,
    nullCondition,
    arrayCondition,
    PartialForm,
    PurgeNull,
    useFormArray,
} from '@togglecorp/toggle-form';
import { IoCalculatorOutline, IoAddOutline } from 'react-icons/io5';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import useOptions from '#hooks/useOptions';
import DomainContext from '#components/DomainContext';
import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import CrisisForm from '#components/forms/CrisisForm';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import NotificationContext from '#components/NotificationContext';
import CrisisSelectInput, { CrisisOption } from '#components/selections/CrisisSelectInput';
import ViolenceContextMultiSelectInput from '#components/selections/ViolenceContextMultiSelectInput';
import Loading from '#components/Loading';
import ActorSelectInput from '#components/selections/ActorSelectInput';
import MarkdownEditor from '#components/MarkdownEditor';
import useModalState from '#hooks/useModalState';
import { transformToFormError } from '#utils/errorTransform';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
    WithId,
    formatDateYmd,
    GetEnumOptions,
} from '#utils/common';

import {
    EventOptionsQuery,
    EventQuery,
    EventQueryVariables,
    CreateEventMutation,
    CreateEventMutationVariables,
    UpdateEventMutation,
    UpdateEventMutationVariables,
    Crisis_Type as CrisisType,
} from '#generated/types';
import EventCodeInput from './EventCodeInput';
import styles from './styles.css';

const EVENT_OPTIONS = gql`
    query EventOptions {
        eventType: __type(name: "CRISIS_TYPE") {
            enumValues {
                name
                description
            }
        }
        dateAccuracy: __type(name: "DATE_ACCURACY") {
            name
            enumValues {
                name
                description
            }
        }
        otherSubTypeList {
            results {
                id
                name
            }
        }
        actorList {
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
        osvSubTypeList {
            results {
                id
                name
            }
        }
    }
`;

const EVENT = gql`
    query Event($id: ID!) {
        event(id: $id) {
            actor {
                id
                name
            }
            countries {
                id
                idmcShortName
            }
            crisis {
                id
                name
            }
            disasterSubType {
                id
                name
            }
            endDate
            endDateAccuracy
            eventNarrative
            eventType
            glideNumbers
            id
            name
            startDate
            startDateAccuracy
            violenceSubType {
                id
                name
            }
            contextOfViolence {
                id
                name
            }
            osvSubType {
                id
                name
            }
            otherSubType {
                id
                name
            }
            includeTriangulationInQa
        }
    }
`;

const CREATE_EVENT = gql`
    mutation CreateEvent($event: EventCreateInputType!) {
        createEvent(data: $event) {
            result {
                actor {
                    id
                    name
                }
                countries {
                    id
                    idmcShortName
                }
                crisis {
                    id
                    name
                }
                disasterSubType {
                    id
                    name
                }
                endDate
                endDateAccuracy
                eventNarrative
                eventType
                glideNumbers
                id
                name
                startDate
                startDateAccuracy
                violenceSubType {
                    id
                    name
                }
                contextOfViolence {
                    id
                    name
                }
                osvSubType {
                    id
                    name
                }
                otherSubType {
                    id
                    name
                }
                includeTriangulationInQa
            }
            errors
        }
    }
`;

const UPDATE_EVENT = gql`
    mutation UpdateEvent($event: EventUpdateInputType!) {
        updateEvent(data: $event) {
            result {
                actor {
                    id
                    name
                }
                countries {
                    id
                    idmcShortName
                }
                crisis {
                    id
                    name
                }
                disasterSubType {
                    id
                    name
                }
                endDate
                endDateAccuracy
                eventNarrative
                eventType
                glideNumbers
                id
                name
                startDate
                startDateAccuracy
                violenceSubType {
                    id
                    name
                }
                contextOfViolence {
                    id
                    name
                }
                osvSubType {
                    id
                    name
                }
                otherSubType {
                    id
                    name
                }
                includeTriangulationInQa
            }
            errors
        }
    }
`;

// Auto-generate functions that are also used for hints
function generateConflictEventName(
    countryNames?: string | undefined,
    violenceName?: string | undefined,
    adminName?: string | undefined,
    startDateInfo?: string | undefined,
) {
    const countryField = countryNames ?? 'Country/ies';
    const violenceField = violenceName ?? 'Main violence type';
    const adminField = adminName ?? 'Admin1';
    const startDateField = startDateInfo ?? 'Start date of violence DD/MM/YYY';
    return `${countryField}: ${violenceField} - ${adminField} - ${startDateField}`;
}

function generateDisasterEventName(
    countryNames?: string | undefined,
    disasterName?: string | undefined,
    adminName?: string | undefined,
    startDateInfo?: string | undefined,
) {
    const countryField = countryNames ?? 'Country/ies';
    const violenceBox = disasterName ?? 'Main hazard type (International/Local name of disaster, if any)';
    const adminField = adminName ?? '(Admin1)';
    const startDateField = startDateInfo ?? 'Start date of hazard DD/MM/YYY';

    return `${countryField}: ${violenceBox} - ${adminField} - ${startDateField}`;
}

// NOTE: the comparison should be type-safe but
// we are currently downcasting string literals to string
const conflict: CrisisType = 'CONFLICT';
const disaster: CrisisType = 'DISASTER';
const other: CrisisType = 'OTHER';

type EventFormFields = CreateEventMutationVariables['event'];
type FormType = PurgeNull<PartialForm<WithId<EventFormFields>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (value): FormSchemaFields => {
        const basicFields: FormSchemaFields = {
            id: [idCondition],
            countries: [requiredListCondition, arrayCondition],
            startDate: [requiredCondition],
            endDate: [requiredCondition],
            startDateAccuracy: [],
            endDateAccuracy: [],
            eventType: [requiredStringCondition],
            glideNumbers: [arrayCondition],
            name: [requiredStringCondition],
            crisis: [],
            eventNarrative: [requiredStringCondition],

            disasterSubType: [nullCondition],
            violenceSubType: [nullCondition],
            contextOfViolence: [arrayCondition, nullCondition],
            osvSubType: [nullCondition],
            actor: [nullCondition],
            otherSubType: [nullCondition],
        };
        if (value?.eventType === conflict) {
            return {
                ...basicFields,
                violenceSubType: [requiredCondition],
                osvSubType: [],
                actor: [],
                contextOfViolence: [arrayCondition],
            };
        }
        if (value?.eventType === disaster) {
            return {
                ...basicFields,
                disasterSubType: [requiredCondition],
            };
        }
        if (value?.eventType === other) {
            return {
                ...basicFields,
                otherSubType: [],
            };
        }
        return basicFields;
    },
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

interface EventCodeFields {
    clientId: string;
    country: string;
    type: string;
    code: string;
}

export interface EventFormProps {
    className?: string;
    onEventCreate?: (result: NonNullable<NonNullable<CreateEventMutation['createEvent']>['result']>) => void;
    onEventFormCancel?: () => void;
    readOnly?: boolean;
    disabled?: boolean;
    clone?: boolean;
    eventHiddenWhileReadonly?: boolean;

    id?: string;
    disabledFields?: ('crisis' | 'countries')[];
    defaultFormValue?: PartialForm<FormType>;
}

function EventForm(props: EventFormProps) {
    const {
        onEventCreate,
        id,
        readOnly,
        eventHiddenWhileReadonly,
        disabled: disabledFromProps,
        className,
        onEventFormCancel,
        clone,
        defaultFormValue = {},
        disabledFields = [],
    } = props;

    const { user } = useContext(DomainContext);
    const crisisPermissions = user?.permissions?.crisis;

    const [
        shouldShowAddCrisisModal,
        crisisModalId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

    const [countries, setCountries] = useOptions('country');
    const [, setCrises] = useOptions('crisis');
    const [, setViolenceContextOptions] = useOptions('contextOfViolence');
    const [
        eventCode,
        setEventCode,
    ] = useState<PartialForm<EventCodeFields[] | undefined>>();

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValue, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [, setActors] = useOptions('actor');

    const eventVariables = useMemo(
        (): EventQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: eventDataLoading,
        error: eventDataError,
    } = useQuery<EventQuery, EventQueryVariables>(
        EVENT,
        {
            skip: !eventVariables,
            variables: eventVariables,
            onCompleted: (response) => {
                const { event } = response;
                if (!event) {
                    return;
                }

                if (event.countries) {
                    setCountries(event.countries);
                }

                if (event.crisis) {
                    setCrises([event.crisis]);
                }

                if (event.actor) {
                    setActors([event.actor]);
                }

                if (event.contextOfViolence) {
                    setViolenceContextOptions(event.contextOfViolence);
                }

                const sanitizedValue = clone ? {
                    ...event,
                    countries: event.countries?.map((item) => item.id),
                    actor: event.actor?.id,
                    crisis: event.crisis?.id,
                    violenceSubType: event.violenceSubType?.id,
                    osvSubType: event.osvSubType?.id,
                    otherSubType: event.otherSubType?.id,
                    disasterSubType: event.disasterSubType?.id,
                    contextOfViolence: event.contextOfViolence?.map((item) => item.id),
                    id: undefined,
                    name: undefined,
                } : {
                    ...event,
                    countries: event.countries?.map((item) => item.id),
                    actor: event.actor?.id,
                    crisis: event.crisis?.id,
                    violenceSubType: event.violenceSubType?.id,
                    osvSubType: event.osvSubType?.id,
                    otherSubType: event.otherSubType?.id,
                    disasterSubType: event.disasterSubType?.id,
                    contextOfViolence: event.contextOfViolence?.map((item) => item.id),
                };
                onValueSet(removeNull(sanitizedValue));
            },
        },
    );

    const {
        data,
        loading: eventOptionsLoading,
        error: eventOptionsError,
    } = useQuery<EventOptionsQuery>(EVENT_OPTIONS);

    const [
        createEvent,
        { loading: createLoading },
    ] = useMutation<CreateEventMutation, CreateEventMutationVariables>(
        CREATE_EVENT,
        {
            onCompleted: (response) => {
                const {
                    createEvent: createEventRes,
                } = response;
                if (!createEventRes) {
                    return;
                }
                const { errors, result } = createEventRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onEventCreate && result) {
                    notify({
                        children: 'Event created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onEventCreate(result);
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateEvent,
        { loading: updateLoading },
    ] = useMutation<UpdateEventMutation, UpdateEventMutationVariables>(
        UPDATE_EVENT,
        {
            onCompleted: (response) => {
                const {
                    updateEvent: updateEventRes,
                } = response;
                if (!updateEventRes) {
                    return;
                }
                const { errors, result } = updateEventRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onEventCreate && result) {
                    notify({
                        children: 'Event updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onEventCreate(result);
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleCrisisCreate = useCallback(
        (newCrisis: CrisisOption) => {
            setCrises((oldCrises) => [...(oldCrises ?? []), newCrisis]);
            onValueChange(newCrisis.id, 'crisis' as const);
            hideAddCrisisModal();
        },
        [onValueChange, hideAddCrisisModal, setCrises],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        if (finalValues.id && !clone) {
            updateEvent({
                variables: {
                    event: finalValues as WithId<EventFormFields>,
                },
            });
        } else {
            createEvent({
                variables: {
                    event: finalValues as EventFormFields,
                },
            });
        }
    }, [createEvent, updateEvent, clone]);

    const loading = createLoading || updateLoading || eventDataLoading;
    const errored = !!eventDataError;
    const disabled = loading || errored || disabledFromProps;

    const eventOptionsDisabled = eventOptionsLoading || !!eventOptionsError;

    const violenceSubTypeOptions = useMemo(
        () => data?.violenceList?.results?.flatMap((violenceType) => (
            violenceType.subTypes?.results?.map((violenceSubType) => ({
                ...violenceSubType,
                violenceTypeId: violenceType.id,
                violenceTypeName: violenceType.name,
            }))
        )).filter(isDefined),
        [data?.violenceList],
    );

    const selectedViolenceSubTypeOption = useMemo(
        () => (
            value.violenceSubType && violenceSubTypeOptions?.find(
                (violenceSubType) => (violenceSubType.id === value.violenceSubType),
            )
        ),
        [value.violenceSubType, violenceSubTypeOptions],
    );

    // FIXME: do not directly use enum labels
    // TODO: pass this data to schema as well
    const osvMode = selectedViolenceSubTypeOption
        && selectedViolenceSubTypeOption?.violenceTypeName.toLocaleLowerCase() === 'other situations of violence (osv)';

    const disasterSubTypeOptions = data?.disasterCategoryList?.results
        ?.flatMap((disasterCategory) => (
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

    const otherSubTypeOptions = data?.otherSubTypeList?.results;

    const handleStartDateChange = useCallback((val: string | undefined) => {
        onValueChange(val, 'startDate');
        if (val && !value.endDate) {
            onValueChange(val, 'endDate');
        }
    }, [onValueChange, value.endDate]);

    const autoGenerateEventName = useCallback(() => {
        const countryNames = countries
            ?.filter((c) => value.countries?.includes(c.id))
            .map((c) => c.idmcShortName)
            .join(', ');

        const adminName = undefined;
        const startDateInfo = formatDateYmd(value.startDate);

        if (value.eventType === 'CONFLICT') {
            // FIXME: do not directly use enum labels
            const violenceName = violenceSubTypeOptions
                ?.find((v) => v.id === value.violenceSubType)?.name;
            const conflictText = generateConflictEventName(
                countryNames, violenceName, adminName, startDateInfo,
            );
            onValueChange(conflictText, 'name' as const);
        } else if (value.eventType === 'DISASTER') {
            // FIXME: do not directly use enum labels
            const disasterName = disasterSubTypeOptions
                ?.find((d) => d.id === value.disasterSubType)?.name;
            const disasterText = generateDisasterEventName(
                countryNames, disasterName, adminName, startDateInfo,
            );
            onValueChange(disasterText, 'name' as const);
        }
    }, [
        onValueChange,
        countries,
        value.countries,
        value.startDate,
        value.eventType,
        value.disasterSubType,
        value.violenceSubType,
        disasterSubTypeOptions,
        violenceSubTypeOptions,
    ]);

    const eventTypes = data?.eventType?.enumValues;
    type EventTypeOptions = GetEnumOptions<
        typeof eventTypes,
        NonNullable<typeof value.eventType>
    >;

    const dateAccuracies = data?.dateAccuracy?.enumValues;
    type DateAccuracyOptions = GetEnumOptions<
        typeof dateAccuracies,
        NonNullable<typeof value.startDateAccuracy>
    >;

    const {
        onValueChange: onEventCodeChange,
        onValueRemove: onEventCodeRemove,
    } = useFormArray<'eventCode', PartialForm<EventCodeFields>>('eventCode', setEventCode);

    const handleEventCodeAddButtonClick = useCallback(
        () => {
            const newEventCodeItem : PartialForm<EventCodeFields> = {
                clientId: randomString(),
            };

            setEventCode(
                (oldValue: PartialForm<EventCodeFields[]> | undefined) => (
                    [...(oldValue ?? []), newEventCodeItem]
                ),
                // 'eventCode' as const,
            );
        }, [],
    );

    const children = (
        <>
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            {(!readOnly || !eventHiddenWhileReadonly) && (
                <TextInput
                    label="Event Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                    readOnly={readOnly}
                    autoFocus
                    hint={(
                        (value.eventType === conflict && generateConflictEventName())
                        || (value.eventType === disaster && generateDisasterEventName())
                        || 'Please select cause (conflict or disaster) to get recommendation'
                    )}
                    actions={!readOnly && (value.eventType && value.eventType !== other) && (
                        <Button
                            name={undefined}
                            onClick={autoGenerateEventName}
                            transparent
                            title="Generate Name"
                        >
                            <IoCalculatorOutline />
                        </Button>
                    )}
                />
            )}
            <SelectInput
                options={eventTypes as EventTypeOptions}
                label="Cause *"
                name="eventType"
                error={error?.fields?.eventType}
                value={value.eventType}
                onChange={onValueChange}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                disabled={disabled || eventOptionsDisabled}
                readOnly={readOnly}
            />
            {value.eventType === conflict && (
                <>
                    <Row>
                        <SelectInput
                            options={violenceSubTypeOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Main trigger *"
                            name="violenceSubType"
                            value={value.violenceSubType}
                            onChange={onValueChange}
                            disabled={disabled || eventOptionsDisabled}
                            error={error?.fields?.violenceSubType}
                            groupLabelSelector={violenceGroupLabelSelector}
                            groupKeySelector={violenceGroupKeySelector}
                            grouped
                            readOnly={readOnly}
                        />
                        {value?.violenceSubType && osvMode && (
                            <SelectInput
                                options={data?.osvSubTypeList?.results}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="OSV Subtype"
                                name="osvSubType"
                                value={value.osvSubType}
                                onChange={onValueChange}
                                error={error?.fields?.osvSubType}
                                disabled={disabled || eventOptionsDisabled}
                                readOnly={readOnly}
                            />
                        )}
                    </Row>
                    <ViolenceContextMultiSelectInput
                        label="Context of Violence"
                        name="contextOfViolence"
                        value={value.contextOfViolence}
                        onChange={onValueChange}
                        error={error?.fields?.contextOfViolence?.$internal}
                        readOnly={readOnly}
                        disabled={disabled}
                    />
                    <ActorSelectInput
                        // NOTE: This input is hidden
                        className={styles.hidden}
                        label="Actor"
                        name="actor"
                        error={error?.fields?.actor}
                        value={value.actor}
                        onChange={onValueChange}
                        disabled={disabled || eventOptionsDisabled}
                        readOnly={readOnly}
                    />
                </>
            )}
            {value.eventType === disaster && (
                <SelectInput
                    options={disasterSubTypeOptions}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    label="Main trigger *"
                    name="disasterSubType"
                    value={value.disasterSubType}
                    onChange={onValueChange}
                    disabled={disabled || eventOptionsDisabled}
                    error={error?.fields?.disasterSubType}
                    readOnly={readOnly}
                    groupLabelSelector={disasterGroupLabelSelector}
                    groupKeySelector={disasterGroupKeySelector}
                    grouped
                />
            )}
            {value.eventType === other && (
                <SelectInput
                    label="Main trigger *"
                    name="otherSubType"
                    options={otherSubTypeOptions}
                    value={value.otherSubType}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.otherSubType}
                    disabled={disabled}
                    readOnly={readOnly}
                />
            )}
            <CountryMultiSelectInput
                label="Countries *"
                name="countries"
                value={value.countries}
                onChange={onValueChange}
                error={error?.fields?.countries?.$internal}
                disabled={disabled}
                readOnly={disabledFields.includes('countries') || readOnly}
            />
            <Button
                className={styles.action}
                name="addEventCode"
                onClick={handleEventCodeAddButtonClick}
                compact
            >
                Add Event Code
            </Button>
            {eventCode?.map((code, index) => (
                <EventCodeInput
                    index={index}
                    value={code}
                    onChange={onEventCodeChange}
                    onRemove={onEventCodeRemove}
                    countryOptions={countries}
                    setCountryOptions={setCountries}
                    error={undefined}
                    disabled={isNotDefined(value.countries)}
                />
            ))}
            <Row>
                <DateInput
                    label="Start Date*"
                    name="startDate"
                    value={value.startDate}
                    onChange={handleStartDateChange}
                    disabled={disabled}
                    error={error?.fields?.startDate}
                    readOnly={readOnly}
                />
                <SelectInput
                    options={dateAccuracies as DateAccuracyOptions}
                    label="Start Date Accuracy"
                    name="startDateAccuracy"
                    error={error?.fields?.startDateAccuracy}
                    value={value.startDateAccuracy}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    disabled={disabled || eventOptionsDisabled}
                    readOnly={readOnly}
                />
            </Row>
            <Row>
                <DateInput
                    label="End Date*"
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.endDate}
                    readOnly={readOnly}
                />
                <SelectInput
                    options={dateAccuracies as DateAccuracyOptions}
                    label="End Date Accuracy"
                    name="endDateAccuracy"
                    error={error?.fields?.endDateAccuracy}
                    value={value.endDateAccuracy}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    disabled={disabled || eventOptionsDisabled}
                    readOnly={readOnly}
                />
            </Row>
            <MarkdownEditor
                label="Event Narrative*"
                name="eventNarrative"
                value={value.eventNarrative}
                onChange={onValueChange}
                disabled={disabled}
                error={error?.fields?.eventNarrative}
                readOnly={readOnly}
            />
            <CrisisSelectInput
                label="Crisis"
                name="crisis"
                error={error?.fields?.crisis}
                value={value.crisis}
                onChange={onValueChange}
                disabled={disabled}
                readOnly={disabledFields.includes('crisis') || readOnly}
                actions={!disabledFields.includes('crisis') && !readOnly && crisisPermissions?.add && (
                    <Button
                        name={undefined}
                        onClick={showAddCrisisModal}
                        disabled={disabled}
                        compact
                        transparent
                        title="Add Crisis"
                    >
                        <IoAddOutline />
                    </Button>
                )}
            />
            {shouldShowAddCrisisModal && (
                <Modal
                    onClose={hideAddCrisisModal}
                    heading="Add Crisis"
                    size="large"
                    freeHeight
                >
                    <CrisisForm
                        id={crisisModalId}
                        onCrisisCreate={handleCrisisCreate}
                        onCrisisFormCancel={hideAddCrisisModal}
                    />
                </Modal>
            )}
            {!readOnly && (
                <div className={styles.formButtons}>
                    {!!onEventFormCancel && (
                        <Button
                            name={undefined}
                            onClick={onEventFormCancel}
                            disabled={disabled}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        name={undefined}
                        disabled={disabled || pristine}
                        variant="primary"
                    >
                        Submit
                    </Button>
                </div>
            )}
        </>
    );

    if (readOnly) {
        // NOTE: so that we can embed this inside another form as readOnly view
        return (
            <div className={_cs(className, styles.eventForm)}>
                {children}
            </div>
        );
    }

    return (
        <form
            className={_cs(className, styles.eventForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {children}
        </form>
    );
}

export default EventForm;
