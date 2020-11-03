import React, { useMemo } from 'react';
import { listToMap } from '@togglecorp/fujs';
import {
    TextInput,
    MultiSelectInput,
    SelectInput,
    Button,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import CrisisForm from '#components/CrisisForm';
import useModalState from '#hooks/useModalState';

import type { Schema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError, ObjectError } from '#utils/errorTransform';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import {
    requiredCondition,
    requiredStringCondition,
} from '#utils/validation';

import {
    EventFormFields,
    BasicEntity,
    BasicEntityWithSubTypes,
    PartialForm,
    EnumEntity,
} from '#types';

import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };

const EVENT_OPTIONS = gql`
    query EventOptions {
        actorList {
            results {
                id
                name
            }
        }
        countryList {
            results {
                id
                name
            }
        }
        crisisList {
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
            }
            crisis {
                id
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

interface EventResponseFields {
    event: {
        id: string;
        name: string;
        eventType: string;

        endDate?: string;
        eventNarrative?: string;
        glideNumber?: string;
        startDate?: string;

        countries?: { id: string }[];
        actor?: { id: string };
        crisis?: { id: string };
        disasterCategory?: { id: string };
        disasterSubCategory?: { id: string };
        disasterType?: { id: string };
        disasterSubType?: { id: string };
        trigger?: { id: string };
        triggerSubType?: { id: string };
        violence?: { id: string };
        violenceSubType?: { id: string };
    }
}

interface EventVariables {
    id: string | undefined;
}

interface EventOptionsResponseFields {
    actorList: BasicEntity[];
    countryList: {
        results: BasicEntity[];
    }
    crisisList: {
        results: BasicEntity[];
    }
    disasterSubTypeList: BasicEntity[];
    triggerList: BasicEntity[];
    subTypeTriggerList: BasicEntity[];
    violenceList: BasicEntityWithSubTypes[];
    eventType: {
        enumValues: EnumEntity<string>[];
    }
}

interface CreateEventResponseFields {
    createEvent: {
        errors?: ObjectError[];
        event: {
            id: string;
        }
    }
}

interface CreateEventVariables {
    event: EventFormFields;
}

interface UpdateEventResponseFields {
    updateEvent: {
        errors?: ObjectError[];
        event: {
            id: string;
        }
    }
}

interface UpdateEventVariables {
    event: WithId<EventFormFields>;
}

const schema: Schema<PartialForm<WithId<EventFormFields>>> = {
    fields: () => ({
        id: [],
        actor: [],
        countries: [],
        crisis: [requiredCondition],
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

const subTypesSelector = (d: BasicEntityWithSubTypes) => d.subTypes;
const emptyBasicEntityList: BasicEntity[] = [];
const emptyBasicEntityWithSubTypesList: BasicEntityWithSubTypes[] = [];

interface EventFormProps {
    onEventCreate?: (id: BasicEntity['id']) => void;
    id?: string;
    crisisId?: string;

    readOnly?: boolean;
}

function EventForm(props: EventFormProps) {
    const {
        onEventCreate,
        id,
        crisisId,
        readOnly,
    } = props;

    const [shouldShowAddCrisisModal, showAddCrisisModal, hideAddCrisisModal] = useModalState();

    const defaultFormValues: PartialForm<WithId<EventFormFields>> = { crisis: crisisId };

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        loading: eventDataLoading,
        error: eventDataError,
    } = useQuery<EventResponseFields, EventVariables>(
        EVENT,
        {
            skip: !id,
            variables: { id },
            onCompleted: (response) => {
                const { event } = response;
                const sanitizedValue = {
                    ...event,
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
                onValueSet(sanitizedValue);
            },
        },
    );

    const {
        data,
        refetch: refetchEventOptions,
        loading: eventOptionsLoading,
        error: eventOptionsError,
    } = useQuery<EventOptionsResponseFields>(EVENT_OPTIONS);

    const [
        createEvent,
        { loading: createLoading },
    ] = useMutation<CreateEventResponseFields, CreateEventVariables>(
        CREATE_EVENT,
        {
            onCompleted: (response) => {
                if (response.createEvent.errors) {
                    const formError = transformToFormError(response.createEvent.errors);
                    onErrorSet(formError);
                } else if (onEventCreate) {
                    onEventCreate(response.createEvent.event?.id);
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
    ] = useMutation<UpdateEventResponseFields, UpdateEventVariables>(
        UPDATE_EVENT,
        {
            onCompleted: (response) => {
                if (response.updateEvent.errors) {
                    const formError = transformToFormError(response.updateEvent.errors);
                    onErrorSet(formError);
                } else if (onEventCreate) {
                    onEventCreate(response.updateEvent.event?.id);
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

    const handleSubmit = React.useCallback((finalValues: PartialForm<WithId<EventFormFields>>) => {
        // const completeValue = finalValues as WithId<EventFormFields>;
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

    const loading = createLoading || updateLoading || eventOptionsLoading || eventDataLoading;
    const errored = !!eventDataError || !!eventOptionsError;

    const disabled = loading || errored;

    const violenceSubTypeOptions = useMemo(
        () => listToMap(
            data?.violenceList ?? emptyBasicEntityWithSubTypesList,
            basicEntityKeySelector,
            subTypesSelector,
        ),
        [data?.violenceList],
    );

    const children = (
        <>
            {error?.$internal && (
                <p>
                    {error?.$internal}
                </p>
            )}
            <div className={styles.crisisRow}>
                <SelectInput
                    options={data?.crisisList?.results}
                    className={styles.crisisSelectInput}
                    label="Crisis *"
                    name="crisis"
                    error={error?.fields?.crisis}
                    value={value.crisis}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    disabled={disabled}
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
                            options={data?.triggerList}
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
                            options={data?.subTypeTriggerList}
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
                            options={data?.violenceList}
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
                        options={data?.disasterSubTypeList}
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
                        options={data?.actorList}
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
                <MultiSelectInput
                    options={data?.countryList?.results}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    label="Country(ies)"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.countries}
                    readOnly={readOnly}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Start Date"
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.startDate}
                    readOnly={readOnly}
                />
                <TextInput
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
                <TextInput
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
                    <Button
                        type="submit"
                        name={undefined}
                        disabled={disabled}
                        variant="primary"
                    >
                        Submit
                    </Button>
                </div>
            )}
        </>
    );

    if (readOnly) {
        return (
            <div className={styles.eventForm}>
                {children}
            </div>
        );
    }

    return (
        <form
            className={styles.eventForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {children}
        </form>
    );
}

export default EventForm;
