import React from 'react';
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
import useForm from '#utils/form';
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
    BasicEntityWithSubCategories,
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
        enumValues: EnumEntity[];
    }
}

// Trigger, violence, actor

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

const CREATE_EVENT = gql`
    mutation CreateEvent($event: EventCreateInputType!) {
        createEvent(event: $event) {
            event {
                id
            }
            errors {
                arrayErrors {
                    key
                }
                field
                messages
            }
        }
    }
`;

const schema: Schema<EventFormFields> = {
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
    value?: EventFormFields;
    onEventCreate?: (id: BasicEntity['id']) => void;
}

const defaultFormValues: EventFormFields = {
    countries: [],
    crisis: '',
    eventType: '',
    name: '',
};

interface BasicEntityWithTypes extends BasicEntity {
    types: BasicEntity[];
}

const typesSelector = (d: BasicEntityWithTypes) => d.types;
const subTypesSelector = (d: BasicEntityWithSubTypes) => d.subTypes;
const subCategoriesSelector = (d: BasicEntityWithSubCategories) => d.subCategories;
const emptyBasicEntityList: BasicEntity[] = [];
const emptyEnumEntityList: EnumEntity[] = [];
const emptyBasicEntityWithSubTypesList: BasicEntityWithSubTypes[] = [];
const emptyBasicEntityWithSubCategoriesList: BasicEntityWithSubCategories[] = [];

function EventForm(props: EventFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
        onEventCreate,
    } = props;

    const {
        data,
        refetch: refetchEventOptions,
    } = useQuery<EventOptionsResponseFields>(EVENT_OPTIONS);

    const [createEvent] = useMutation(
        CREATE_EVENT,
        {
            onCompleted: (response) => {
                if (response.errors) {
                    console.error(response.errors);
                    return;
                }

                if (onEventCreate) {
                    onEventCreate(response?.createEvent?.event?.id);
                }
            },
        },
    );

    const [
        violenceSubTypeOptions,
        triggerSubTypeOptions,
    ] = React.useMemo(() => ([
        listToMap(
            data?.violenceList ?? emptyBasicEntityWithSubTypesList,
            basicEntityKeySelector,
            subTypesSelector,
        ),
        listToMap(
            data?.triggerList ?? emptyBasicEntityWithSubTypesList,
            basicEntityKeySelector,
            subTypesSelector,
        ),
    ]), [data]);

    const handleSubmit = React.useCallback((finalValues: EventFormFields) => {
        createEvent({
            variables: {
                event: finalValues,
            },
        });
    }, [createEvent]);

    const {
        value,
        error,
        onValueChange,
        onFormSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    const [shouldShowAddCrisisModal, showAddCrisisModal, hideAddCrisisModal] = useModalState();

    const handleCrisisCreate = React.useCallback((newCrisisId) => {
        refetchEventOptions();
        onValueChange(newCrisisId, 'crisis');
        hideAddCrisisModal();
    }, [refetchEventOptions, onValueChange, hideAddCrisisModal]);

    return (
        <>
            <form
                className={styles.eventForm}
                onSubmit={onFormSubmit}
            >
                <div className={styles.crisisRow}>
                    <SelectInput
                        options={data?.crisisList?.results ?? emptyBasicEntityList}
                        className={styles.crisisSelectInput}
                        label="Crisis *"
                        name="crisis"
                        value={value.crisis}
                        error={error?.fields?.crisis}
                        onChange={onValueChange}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                    />
                    <Button
                        name={undefined}
                        onClick={showAddCrisisModal}
                        className={styles.addCrisisButton}
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
                            <CrisisForm onCrisisCreate={handleCrisisCreate} />
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
                    />
                </div>
                <div className={styles.twoColumnRow}>
                    <SelectInput
                        options={data?.eventType?.enumValues ?? emptyEnumEntityList}
                        label="Event Type *"
                        name="eventType"
                        error={error?.fields?.eventType}
                        value={value.eventType}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                    />
                    <TextInput
                        label="Glide Number"
                        name="glideNumber"
                        value={value.glideNumber}
                        onChange={onValueChange}
                        error={error?.fields?.glideNumber}
                    />
                </div>
                { value.eventType === 'CONFLICT' && (
                    <>
                        <div className={styles.twoColumnRow}>
                            <SelectInput
                                options={data?.triggerList ?? emptyBasicEntityList}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Trigger"
                                name="trigger"
                                value={value.trigger}
                                onChange={onValueChange}
                                error={error?.fields?.trigger}
                            />
                            <SelectInput
                                options={value.trigger ? (
                                    triggerSubTypeOptions[value.trigger] ?? emptyBasicEntityList
                                ) : (
                                    emptyBasicEntityList
                                )}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Sub-type"
                                name="triggerSubType"
                                value={value.triggerSubType}
                                onChange={onValueChange}
                            />
                        </div>
                        <div className={styles.twoColumnRow}>
                            <SelectInput
                                options={data?.violenceList ?? emptyBasicEntityList}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Type of Violence"
                                name="violence"
                                value={value.violence}
                                onChange={onValueChange}
                            />
                            <SelectInput
                                options={value.violence ? (
                                    violenceSubTypeOptions[value.violence] ?? emptyBasicEntityList
                                ) : (
                                    emptyBasicEntityList
                                )}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Sub-type"
                                name="violenceSubType"
                                value={value.violenceSubType}
                                onChange={onValueChange}
                            />
                        </div>
                    </>
                )}
                <div className={styles.twoColumnRow}>
                    { value.eventType === 'DISASTER' && (
                        <SelectInput
                            options={data?.disasterSubTypeList ?? emptyBasicEntityList}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Disaster type"
                            name="disasterSubType"
                            value={value.disasterSubType}
                            onChange={onValueChange}
                        />
                    )}
                    { value.eventType === 'CONFLICT' && (
                        <SelectInput
                            options={data?.actorList ?? emptyBasicEntityList}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Actor"
                            name="actor"
                            value={value.actor}
                            onChange={onValueChange}
                        />
                    )}
                    <MultiSelectInput
                        options={data?.countryList?.results ?? emptyBasicEntityList}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Country(ies)"
                        name="countries"
                        value={value.countries}
                        onChange={onValueChange}
                    />
                </div>
                <div className={styles.twoColumnRow}>
                    <TextInput
                        label="Start Date"
                        name="startDate"
                        value={value.startDate}
                        onChange={onValueChange}
                    />
                    <TextInput
                        label="End Date"
                        name="endDate"
                        value={value.endDate}
                        onChange={onValueChange}
                    />
                </div>
                <div className={styles.row}>
                    <TextInput
                        label="Event Narrative"
                        name="eventNarrative"
                        value={value.eventNarrative}
                        onChange={onValueChange}
                    />
                </div>
                <div className={styles.actions}>
                    <Button
                        type="submit"
                        name={undefined}
                    >
                        Submit
                    </Button>
                </div>
            </form>
        </>
    );
}

export default EventForm;
