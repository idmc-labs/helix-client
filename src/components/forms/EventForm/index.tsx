import React, { useState, useContext, useEffect, useMemo } from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    TextInput,
    SelectInput,
    Button,
    Modal,
    DateInput,
    TextArea,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    requiredStringCondition,
    idCondition,
    nullCondition,
    arrayCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import CrisisForm from '#components/forms/CrisisForm';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import NotificationContext from '#components/NotificationContext';
import CrisisSelectInput, { CrisisOption } from '#components/selections/CrisisSelectInput';
import Loading from '#components/Loading';
import ActorSelectInput, { ActorOption } from '#components/selections/ActorSelectInput';

import useModalState from '#hooks/useModalState';
import { transformToFormError } from '#utils/errorTransform';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import {
    EventOptionsQuery,
    EventQuery,
    EventQueryVariables,
    CreateEventMutation,
    CreateEventMutationVariables,
    UpdateEventMutation,
    UpdateEventMutationVariables,
} from '#generated/types';
import styles from './styles.css';
import InfoIcon from '#components/InfoIcon';

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
        otherSubType: __type(name: "EVENT_OTHER_SUB_TYPE") {
            enumValues {
                name
                description
            }
        }
        actorList {
            results {
                id
                name
            }
        }
        triggerList {
            results {
                id
                name
            }
        }
        subTriggerList {
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
            }
            endDate
            endDateAccuracy
            eventNarrative
            eventType
            glideNumber
            id
            name
            startDate
            startDateAccuracy
            trigger {
                id
            }
            triggerSubType {
                id
            }
            violence {
                id
                name
            }
            violenceSubType {
                id
            }
            otherSubType
        }
    }
`;

const CREATE_EVENT = gql`
    mutation CreateEvent($event: EventCreateInputType!) {
        createEvent(data: $event) {
            result {
                id
                name
            }
            errors
        }
    }
`;

const UPDATE_EVENT = gql`
    mutation UpdateEvent($event: EventUpdateInputType!) {
        updateEvent(data: $event) {
            result {
                id
                name
            }
            errors
        }
    }
`;

// FIXME: the comparision should be type-safe but
// we are currently downcasting string literals to string
const conflict = 'CONFLICT' as const;
const disaster = 'DISASTER' as const;
const other = 'OTHER' as const;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type EventFormFields = CreateEventMutationVariables['event'];
type FormType = PurgeNull<PartialForm<WithId<Omit<EventFormFields, 'eventType' | 'otherSubType' | 'startDateAccuracy' | 'endDateAccuracy'> & { eventType: string, otherSubType: string, startDateAccuracy: string, endDateAccuracy: string }>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (value): FormSchemaFields => {
        const basicFields: FormSchemaFields = {
            id: [idCondition],
            countries: [requiredCondition, arrayCondition],
            startDate: [],
            endDate: [],
            startDateAccuracy: [],
            endDateAccuracy: [],
            eventType: [requiredStringCondition],
            glideNumber: [],
            name: [requiredStringCondition],
            crisis: [],
            eventNarrative: [],

            disasterSubType: [nullCondition],
            violence: [nullCondition],
            violenceSubType: [nullCondition],
            actor: [nullCondition],
            trigger: [nullCondition],
            triggerSubType: [nullCondition],
            otherSubType: [nullCondition],
        };
        if (value.eventType === conflict) {
            return {
                ...basicFields,
                violence: [],
                violenceSubType: [],
                actor: [],
                trigger: [],
                triggerSubType: [],
            };
        }
        if (value.eventType === disaster) {
            return {
                ...basicFields,
                disasterSubType: [],
            };
        }
        if (value.eventType === other) {
            return {
                ...basicFields,
                otherSubType: [],
            };
        }
        return basicFields;
    },
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

interface EventFormProps {
    className?: string;
    onEventCreate?: (result: NonNullable<NonNullable<CreateEventMutation['createEvent']>['result']>) => void;
    id?: string;
    readOnly?: boolean;
    onEventFormCancel?: () => void;
    defaultCrisis?: CrisisOption | null | undefined;
}

function EventForm(props: EventFormProps) {
    const {
        onEventCreate,
        id,
        readOnly,
        className,
        onEventFormCancel,
        defaultCrisis,
    } = props;

    const [
        shouldShowAddCrisisModal,
        crisisModalId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

    const [
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        crises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>(defaultCrisis ? [defaultCrisis] : undefined);
    const [
        actors,
        setActors,
    ] = useState<ActorOption[] | null | undefined>();

    const defaultFormValues: PartialForm<FormType> = { crisis: defaultCrisis?.id };

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    useEffect(
        () => {
            // NOTE:
            // If value.trigger is undefined, then clear out value.triggerSubType
            if (!value.trigger) {
                onValueChange(undefined, 'triggerSubType' as const);
            }
        },
        [value.trigger, onValueChange],
    );

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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

                const sanitizedValue = {
                    ...event,
                    // FIXME: the typing error should be fixed on the server
                    countries: event.countries?.map((item) => item.id),
                    actor: event.actor?.id,
                    crisis: event.crisis?.id,
                    violence: event.violence?.id,
                    violenceSubType: event.violenceSubType?.id,
                    trigger: event.trigger?.id,
                    triggerSubType: event.triggerSubType?.id,
                    disasterSubType: event.disasterSubType?.id,
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
                    notify({ children: 'Event created successfully!' });
                    onPristineSet(true);
                    onEventCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
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
                    notify({ children: 'Event updated successfully!' });
                    onPristineSet(true);
                    onEventCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleCrisisCreate = React.useCallback(
        (newCrisis: CrisisOption) => {
            setCrises((oldCrises) => [...(oldCrises ?? []), newCrisis]);
            onValueChange(newCrisis.id, 'crisis' as const);
            hideAddCrisisModal();
        },
        [onValueChange, hideAddCrisisModal],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
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
    }, [createEvent, updateEvent]);

    const handleViolenceChange = React.useCallback(
        (val: string | undefined, name: 'violence') => {
            onValueChange(val, name);
            onValueChange(undefined, 'violenceSubType' as const);
        },
        [onValueChange],
    );

    const loading = createLoading || updateLoading || eventDataLoading;
    const errored = !!eventDataError;
    const disabled = loading || errored;

    const eventOptionsDisabled = eventOptionsLoading || !!eventOptionsError;

    const violenceOptions = data?.violenceList?.results;

    // eslint-disable-next-line max-len
    const selectedViolenceOption = violenceOptions?.find((violence) => (violence.id === value.violence));
    const violenceSubTypeOptions = selectedViolenceOption?.subTypes?.results;

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

    const otherSubTypeOptions = data?.otherSubType?.enumValues;

    const children = (
        <>
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.crisisRow}>
                <CrisisSelectInput
                    options={crises}
                    className={styles.crisisSelectInput}
                    label="Crisis *"
                    name="crisis"
                    error={error?.fields?.crisis}
                    value={value.crisis}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setCrises}
                    readOnly={!!defaultCrisis?.id || readOnly}
                />
                {!defaultCrisis?.id && !readOnly && (
                    <Button
                        name={undefined}
                        onClick={showAddCrisisModal}
                        className={styles.addCrisisButton}
                        disabled={disabled}
                    >
                        Add Crisis
                    </Button>
                )}
                {shouldShowAddCrisisModal && (
                    <Modal
                        className={styles.addCrisisModal}
                        bodyClassName={styles.body}
                        onClose={hideAddCrisisModal}
                        heading="Add Crisis"
                    >
                        <CrisisForm
                            id={crisisModalId}
                            onCrisisCreate={handleCrisisCreate}
                            onCrisisFormCancel={hideAddCrisisModal}
                        />
                    </Modal>
                )}
            </div>
            <Row>
                <SelectInput
                    options={data?.eventType?.enumValues}
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
            </Row>
            <Row>
                <TextInput
                    label="Event Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                    readOnly={readOnly}
                    actions={(
                        <InfoIcon
                            tooltip="Country/ies: Main hazard type
                               OR International/Local name of disaster–Admin11(Admin2/3/4or location)
                               -Hazard Event Start Date DD/MM/YYYY"
                        />
                    )}
                />
            </Row>
            {value.eventType === conflict && (
                <>
                    <Row>
                        <SelectInput
                            options={violenceOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence Type"
                            name="violence"
                            value={value.violence}
                            onChange={handleViolenceChange}
                            disabled={disabled || eventOptionsDisabled}
                            error={error?.fields?.violence}
                            readOnly={readOnly}
                        />
                        <SelectInput
                            options={violenceSubTypeOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence Subtype"
                            name="violenceSubType"
                            value={value.violenceSubType}
                            onChange={onValueChange}
                            disabled={disabled || eventOptionsDisabled || !value.violence}
                            error={error?.fields?.violenceSubType}
                            readOnly={readOnly}
                        />
                    </Row>
                    <Row>
                        <ActorSelectInput
                            options={actors}
                            label="Actor"
                            name="actor"
                            error={error?.fields?.actor}
                            value={value.actor}
                            onChange={onValueChange}
                            disabled={disabled || eventOptionsDisabled}
                            onOptionsChange={setActors}
                            readOnly={readOnly}
                        />
                    </Row>
                    <Row>
                        <SelectInput
                            options={data?.triggerList?.results}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Trigger"
                            name="trigger"
                            value={value.trigger}
                            onChange={onValueChange}
                            error={error?.fields?.trigger}
                            disabled={disabled || eventOptionsDisabled}
                            readOnly={readOnly}
                        />
                        <SelectInput
                            options={data?.subTriggerList?.results}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Trigger Sub-type"
                            name="triggerSubType"
                            value={value.triggerSubType}
                            onChange={onValueChange}
                            error={error?.fields?.triggerSubType}
                            disabled={disabled || eventOptionsDisabled || !value.trigger}
                            readOnly={readOnly}
                        />
                    </Row>
                </>
            )}
            {value.eventType === disaster && (
                <Row>
                    <SelectInput
                        options={disasterSubTypeOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Disaster Category"
                        name="disasterSubType"
                        value={value.disasterSubType}
                        onChange={onValueChange}
                        disabled={disabled || eventOptionsDisabled}
                        error={error?.fields?.disasterSubType}
                        readOnly={readOnly}
                        groupLabelSelector={otherGroupLabelSelector}
                        groupKeySelector={otherGroupKeySelector}
                        grouped
                    />
                </Row>
            )}
            {value.eventType === other && (
                <Row>
                    <SelectInput
                        label="Other Subtypes *"
                        name="otherSubType"
                        options={otherSubTypeOptions}
                        value={value.otherSubType}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        onChange={onValueChange}
                        error={error?.fields?.otherSubType}
                        disabled={disabled}
                        readOnly={readOnly}
                    />
                </Row>
            )}
            <Row>
                <CountryMultiSelectInput
                    options={countries}
                    onOptionsChange={setCountries}
                    label="Countries *"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries?.$internal}
                    disabled={disabled}
                    readOnly={readOnly}
                />
                <TextInput
                    label="Glide Number"
                    name="glideNumber"
                    value={value.glideNumber}
                    onChange={onValueChange}
                    error={error?.fields?.glideNumber}
                    disabled={disabled}
                    readOnly={readOnly}
                />
            </Row>
            <Row>
                <DateInput
                    label="Start Date"
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.startDate}
                    readOnly={readOnly}
                />
                <SelectInput
                    options={data?.dateAccuracy?.enumValues}
                    label="Start Date Accuracy *"
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
                    label="End Date"
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.endDate}
                    readOnly={readOnly}
                />
                <SelectInput
                    options={data?.dateAccuracy?.enumValues}
                    label="End Date Accuracy *"
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
            <Row>
                <TextArea
                    label="Event Narrative"
                    name="eventNarrative"
                    value={value.eventNarrative}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.eventNarrative}
                    readOnly={readOnly}
                />
            </Row>
            {!readOnly && (
                <div className={styles.formButtons}>
                    {!!onEventFormCancel && (
                        <Button
                            name={undefined}
                            onClick={onEventFormCancel}
                            className={styles.button}
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
                        className={styles.button}
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
