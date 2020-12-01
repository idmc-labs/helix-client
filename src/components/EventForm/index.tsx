import React, { useState, useMemo, useContext } from 'react';
import {
    listToMap,
    _cs,
} from '@togglecorp/fujs';
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
    BasicEntity,
    BasicEntityWithSubTypes,
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

const EVENT_OPTIONS = gql`
    query EventOptions {
        actorList {
            results {
                id
                name
            }
        }
        disasterSubTypeList {
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
        eventType: __type(name: "CRISIS_TYPE") {
            enumValues {
                name
                description
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
            disasterCategory {
                id
            }
            disasterSubCategory {
                id
            }
            disasterSubType {
                id
            }
            disasterType {
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
            violence {
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
        disasterCategory: [],
        disasterSubCategory: [],
        disasterType: [],
        disasterSubType: [],
        endDate: [],
        eventNarrative: [],
        eventType: [requiredStringCondition],
        glideNumber: [],
        name: [requiredStringCondition],
        startDate: [],
        trigger: [],
        triggerSubType: [],
        violence: [],
        violenceSubType: [],
    }),
};

const emptyBasicEntityList: BasicEntity[] = [];
const emptyBasicEntityWithSubTypesList: BasicEntityWithSubTypes[] = [];

interface EventFormProps {
    className?: string;
    onEventCreate?: (id: BasicEntity['id']) => void;
    id?: string;
    crisisId?: string;
    readOnly?: boolean;
    onEventFormCancel?: () => void;
    defaultCrises?: CrisisOption | null | undefined;
}

function EventForm(props: EventFormProps) {
    const {
        onEventCreate,
        id,
        crisisId,
        readOnly,
        className,
        onEventFormCancel,
        defaultCrises,
    } = props;

    const [shouldShowAddCrisisModal, showAddCrisisModal, hideAddCrisisModal] = useModalState();
    const [
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        crises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>(defaultCrises ? [defaultCrises] : undefined);

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
                    violence: event.violence?.id,
                    violenceSubType: event.violenceSubType?.id,
                    trigger: event.trigger?.id,
                    triggerSubType: event.triggerSubType?.id,
                    disasterType: event.disasterType?.id,
                    disasterSubType: event.disasterSubType?.id,
                    disasterCategory: event.disasterCategory?.id,
                    disasterSubCategory: event.disasterSubCategory?.id,
                };
                onValueSet(removeNull(sanitizedValue));
            },
        },
    );

    const {
        data,
        refetch: refetchEventOptions,
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
                    onEventCreate(result.id);
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    // FIXME: a lot of repeated code for update and create
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
                    onEventCreate(result.id);
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleCrisisCreate = React.useCallback((newCrisisId: BasicEntity['id']) => {
        refetchEventOptions();
        onValueChange(newCrisisId, 'crisis' as const);
        hideAddCrisisModal();
    }, [refetchEventOptions, onValueChange, hideAddCrisisModal]);

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

    const loading = createLoading || updateLoading
        || eventOptionsLoading || eventDataLoading;
    const errored = !!eventDataError || !!eventOptionsError;

    const disabled = loading || errored;

    const violenceSubTypeOptions = useMemo(
        () => listToMap(
            data?.violenceList?.results ?? [],
            (item) => item.id,
            (item) => item?.subTypes?.results ?? emptyBasicEntityWithSubTypesList,
        ),
        [data?.violenceList],
    );

    const children = (
        <>
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
            { value.eventType === 'CONFLICT' && (
                <>
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
                            disabled={disabled}
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
                            disabled={disabled}
                            readOnly={readOnly}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
                        <SelectInput
                            options={data?.violenceList?.results}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence"
                            name="violence"
                            value={value.violence}
                            onChange={onValueChange}
                            disabled={disabled}
                            error={error?.fields?.violence}
                            readOnly={readOnly}
                        />
                        <SelectInput
                            options={(
                                value.violence
                                    ? violenceSubTypeOptions[value.violence]
                                    : emptyBasicEntityList
                            )}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence Sub-type"
                            name="violenceSubType"
                            value={value.violenceSubType}
                            onChange={onValueChange}
                            disabled={disabled}
                            error={error?.fields?.violenceSubType}
                            readOnly={readOnly}
                        />
                    </div>
                </>
            )}
            <div className={styles.twoColumnRow}>
                { value.eventType === 'DISASTER' && (
                    <SelectInput
                        options={data?.disasterSubTypeList?.results}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Disaster Type"
                        name="disasterSubType"
                        value={value.disasterSubType}
                        onChange={onValueChange}
                        disabled={disabled}
                        error={error?.fields?.disasterSubType}
                        readOnly={readOnly}
                    />
                )}
                { value.eventType === 'CONFLICT' && (
                    <SelectInput
                        options={data?.actorList?.results}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Actor"
                        name="actor"
                        value={value.actor}
                        onChange={onValueChange}
                        disabled={disabled}
                        error={error?.fields?.actor}
                        readOnly={readOnly}
                    />
                )}
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
                <div className={styles.actions}>
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
