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
    EnumEntity,
} from '#types';

import styles from './styles.css';

interface EventOptionsResponseFields {
    actorList: BasicEntity[];
    countryList: {
        results: BasicEntity[];
    }
    crisisList: {
        results: BasicEntity[];
    }
    disasterSubTypeList: BasicEntity[];
    triggerList: BasicEntityWithSubTypes[];
    violenceList: BasicEntityWithSubTypes[];
    eventType: {
        enumValues: EnumEntity<string>[];
    }
}

const EVENT_OPTIONS = gql`
    query EventOptions {
        actorList {
            id
            name
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
            id
            name
        }
        triggerList {
            id
            name
            subTypes {
                id
                name
            }
        }
        violenceList {
            id
            name
            subTypes {
                id
                name
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

interface CreateEventVariables {
    event: EventFormFields;
}

interface CreateEventResponseFields {
    createEvent: {
        errors?: ObjectError[];
        event: {
            id: string;
        }
    }
}

const CREATE_EVENT = gql`
    mutation CreateEvent($event: EventCreateInputType!) {
        createEvent(event: $event) {
            event {
                id
            }
            errors {
                field
                messages
            }
        }
    }
`;

const schema: Schema<Partial<EventFormFields>> = {
    fields: () => ({
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

interface EventFormProps {
    value?: Partial<EventFormFields>;
    onEventCreate?: (id: BasicEntity['id']) => void;
}

const defaultFormValues: Partial<EventFormFields> = {
    countries: [],
    crisis: '',
    eventType: '',
    name: '',
};

const subTypesSelector = (d: BasicEntityWithSubTypes) => d.subTypes;
const emptyBasicEntityList: BasicEntity[] = [];
const emptyBasicEntityWithSubTypesList: BasicEntityWithSubTypes[] = [];

function EventForm(props: EventFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
        onEventCreate,
    } = props;

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(initialFormValues, schema);

    const {
        data,
        refetch: refetchEventOptions,
        loading: eventOptionsLoading,
    } = useQuery<EventOptionsResponseFields>(EVENT_OPTIONS);

    const [
        createEvent,
        { loading: saveLoading },
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
        },
    );

    const violenceSubTypeOptions = useMemo(
        () => listToMap(
            data?.violenceList ?? emptyBasicEntityWithSubTypesList,
            basicEntityKeySelector,
            subTypesSelector,
        ),
        [data?.violenceList],
    );
    const triggerSubTypeOptions = useMemo(
        () => listToMap(
            data?.triggerList ?? emptyBasicEntityWithSubTypesList,
            basicEntityKeySelector,
            subTypesSelector,
        ),
        [data?.triggerList],
    );

    const [shouldShowAddCrisisModal, showAddCrisisModal, hideAddCrisisModal] = useModalState();

    const handleCrisisCreate = React.useCallback((newCrisisId: BasicEntity['id']) => {
        refetchEventOptions();
        onValueChange(newCrisisId, 'crisis' as const);
        hideAddCrisisModal();
    }, [refetchEventOptions, onValueChange, hideAddCrisisModal]);

    const handleSubmit = React.useCallback((finalValues: Partial<EventFormFields>) => {
        const completeValue = finalValues as EventFormFields;
        createEvent({
            variables: {
                event: completeValue,
            },
        });
    }, [createEvent]);

    const loading = saveLoading || eventOptionsLoading;

    return (
        <>
            <form
                className={styles.eventForm}
                onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            >
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
                        disabled={loading}
                    />
                    <Button
                        name={undefined}
                        onClick={showAddCrisisModal}
                        className={styles.addCrisisButton}
                        disabled={loading}
                    >
                        Add Crisis
                    </Button>
                    { shouldShowAddCrisisModal && (
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
                        disabled={loading}
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
                        disabled={loading}
                    />
                    <TextInput
                        label="Glide Number"
                        name="glideNumber"
                        value={value.glideNumber}
                        onChange={onValueChange}
                        error={error?.fields?.glideNumber}
                        disabled={loading}
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
                                disabled={loading}
                            />
                            <SelectInput
                                options={(
                                    value.trigger
                                        ? triggerSubTypeOptions[value.trigger]
                                        : undefined
                                )}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Sub-type"
                                name="triggerSubType"
                                value={value.triggerSubType}
                                onChange={onValueChange}
                                disabled={loading}
                            />
                        </div>
                        <div className={styles.twoColumnRow}>
                            <SelectInput
                                options={data?.violenceList}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Type of Violence"
                                name="violence"
                                value={value.violence}
                                onChange={onValueChange}
                                disabled={loading}
                            />
                            <SelectInput
                                options={(
                                    value.violence
                                        ? violenceSubTypeOptions[value.violence]
                                        : emptyBasicEntityList
                                )}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Sub-type"
                                name="violenceSubType"
                                value={value.violenceSubType}
                                onChange={onValueChange}
                                disabled={loading}
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
                            label="Disaster type"
                            name="disasterSubType"
                            value={value.disasterSubType}
                            onChange={onValueChange}
                            disabled={loading}
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
                            disabled={loading}
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
                        disabled={loading}
                    />
                </div>
                <div className={styles.twoColumnRow}>
                    <TextInput
                        label="Start Date"
                        name="startDate"
                        value={value.startDate}
                        onChange={onValueChange}
                        disabled={loading}
                    />
                    <TextInput
                        label="End Date"
                        name="endDate"
                        value={value.endDate}
                        onChange={onValueChange}
                        disabled={loading}
                    />
                </div>
                <div className={styles.row}>
                    <TextInput
                        label="Event Narrative"
                        name="eventNarrative"
                        value={value.eventNarrative}
                        onChange={onValueChange}
                        disabled={loading}
                    />
                </div>
                <div className={styles.actions}>
                    <Button
                        type="submit"
                        name={undefined}
                        disabled={loading}
                    >
                        Submit
                    </Button>
                </div>
            </form>
        </>
    );
}

export default EventForm;
