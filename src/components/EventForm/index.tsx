import React, { useState, useContext, useEffect } from 'react';
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
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import CrisisForm from '#components/CrisisForm';
import CountryMultiSelectInput, { CountryOption } from '#components/CountryMultiSelectInput';
import NotificationContext from '#components/NotificationContext';
import CrisisSelectInput, { CrisisOption } from '#components/CrisisSelectInput';
import Loading from '#components/Loading';

import useModalState from '#hooks/useModalState';

import { removeNull } from '#utils/schema';
import type { Schema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import {
    requiredCondition,
    requiredStringCondition,
    idCondition,
} from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';

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

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type EventFormFields = CreateEventMutationVariables['event'];
type FormType = PurgeNull<PartialForm<WithId<Omit<EventFormFields, 'eventType'> & { eventType: string }>>>;

interface WithGroup {
    violenceId: string;
    violenceName: string;
}
const groupKeySelector = (item: WithGroup) => item.violenceId;
const groupLabelSelector = (item: WithGroup) => item.violenceName;

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

const EVENT_OPTIONS = gql`
    query EventOptions {
        eventType: __type(name: "CRISIS_TYPE") {
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
            }
            countries {
                id
                name
            }
            crisis {
                id
                name
            }
            disasterSubType {
                id
            }
            endDate
            eventNarrative
            eventType
            glideNumber
            id
            name
            startDate
            trigger {
                id
            }
            triggerSubType {
                id
            }
            violenceSubType {
                id
            }
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
            errors {
                field
                messages
            }
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
            errors {
                field
                messages
            }
        }
    }
`;

const schema: Schema<FormType> = {
    fields: () => ({
        id: [idCondition],
        actor: [],
        countries: [requiredCondition],
        crisis: [],
        endDate: [],
        eventNarrative: [],
        eventType: [requiredStringCondition],
        glideNumber: [],
        name: [requiredStringCondition],
        startDate: [],
        disasterSubType: [],
        trigger: [],
        triggerSubType: [],
        violenceSubType: [],
    }),
};

interface EventFormProps {
    className?: string;
    onEventCreate?: (result: NonNullable<NonNullable<CreateEventMutation['createEvent']>['result']>) => void;
    id?: string;
    crisisId?: string;
    readOnly?: boolean;
    onEventFormCancel?: () => void;
    defaultCrisis?: CrisisOption | null | undefined;
}

function EventForm(props: EventFormProps) {
    const {
        onEventCreate,
        id,
        crisisId,
        readOnly,
        className,
        onEventFormCancel,
        defaultCrisis,
    } = props;

    const [shouldShowAddCrisisModal, showAddCrisisModal, hideAddCrisisModal] = useModalState();
    const [
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        crises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>(defaultCrisis ? [defaultCrisis] : undefined);

    const defaultFormValues: PartialForm<FormType> = { crisis: crisisId };

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

    const { notify } = useContext(NotificationContext);

    const {
        loading: eventDataLoading,
        error: eventDataError,
    } = useQuery<EventQuery, EventQueryVariables>(
        EVENT,
        {
            skip: !id,
            variables: id ? { id } : undefined,
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

                const sanitizedValue = {
                    ...event,
                    // FIXME: the typing error should be fixed on the server
                    countries: event.countries?.map((item) => item.id),
                    actor: event.actor?.id,
                    crisis: event.crisis?.id,
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
                    onErrorSet(formError);
                }
                if (onEventCreate && result) {
                    notify({ children: 'Event created successfully!' });
                    onPristineSet(true);
                    onEventCreate(result);
                }
            },
            onError: (errors) => {
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
                    onErrorSet(formError);
                }
                if (onEventCreate && result) {
                    notify({ children: 'Event updated successfully!' });
                    onPristineSet(true);
                    onEventCreate(result);
                }
            },
            onError: (errors) => {
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

    const loading = createLoading || updateLoading || eventDataLoading;
    const errored = !!eventDataError;
    const disabled = loading || errored;

    const eventOptionsDisabled = eventOptionsLoading || !!eventOptionsError;

    const violenceSubTypeOptions = data?.violenceList?.results?.flatMap((violence) => (
        violence.subTypes?.results?.map((violenceSubType) => ({
            ...violenceSubType,
            violenceId: violence.id,
            violenceName: violence.name,
        }))
    ))?.filter(isDefined);

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
    ))?.filter(isDefined);

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
                    readOnly={!!crisisId || readOnly}
                />
                {!crisisId && !readOnly && (
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
                            onCrisisCreate={handleCrisisCreate}
                            onCrisisFormCancel={hideAddCrisisModal}
                        />
                    </Modal>
                )}
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Event Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                    readOnly={readOnly}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <SelectInput
                    options={data?.eventType?.enumValues}
                    label="Event Type *"
                    name="eventType"
                    error={error?.fields?.eventType}
                    value={value.eventType}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    disabled={disabled || eventOptionsDisabled}
                    readOnly={readOnly}
                />
            </div>
            {value.eventType === 'CONFLICT' && (
                <>
                    <div className={styles.twoColumnRow}>
                        <SelectInput
                            options={violenceSubTypeOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence"
                            name="violenceSubType"
                            value={value.violenceSubType}
                            onChange={onValueChange}
                            disabled={disabled || eventOptionsDisabled}
                            error={error?.fields?.violenceSubType}
                            readOnly={readOnly}
                            groupLabelSelector={groupLabelSelector}
                            groupKeySelector={groupKeySelector}
                            grouped
                        />
                        <SelectInput
                            options={data?.actorList?.results}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Actor"
                            name="actor"
                            value={value.actor}
                            onChange={onValueChange}
                            disabled={disabled || eventOptionsDisabled}
                            error={error?.fields?.actor}
                            readOnly={readOnly}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
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
                    </div>
                </>
            )}
            {value.eventType === 'DISASTER' && (
                <div className={styles.twoColumnRow}>
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
                </div>
            )}
            <div className={styles.twoColumnRow}>
                <CountryMultiSelectInput
                    options={countries}
                    onOptionsChange={setCountries}
                    label="Countries *"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries}
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
            </div>
            <div className={styles.twoColumnRow}>
                <DateInput
                    label="Start Date"
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.startDate}
                    readOnly={readOnly}
                />
                <DateInput
                    label="End Date"
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.endDate}
                    readOnly={readOnly}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Event Narrative"
                    name="eventNarrative"
                    value={value.eventNarrative}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.eventNarrative}
                    readOnly={readOnly}
                />
            </div>
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
