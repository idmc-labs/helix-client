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
    requiredListCondition,
} from '#utils/validation';

import {
    EventFormFields,
    BasicEntity,
    EnumEntity,
} from '#types';

import styles from './styles.css';

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
        disasterCategoryList {
            id
            name
        }
        disasterSubCategoryList {
            id
            name
        }
        disasterTypeList {
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
        __type(name: "CRISIS_TYPE") {
            name
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

const subTypesSelector = (d: { subTypes: unknown[] }) => d.subTypes;
const emptyList: unknown[] = [];

function EventForm(p: EventFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
        onEventCreate,
    } = p;

    const [showCrisisFormModal, setShowCrisisFormModal] = React.useState(false);

    const {
        data,
        refetch: refetchEventOptions,
    } = useQuery(EVENT_OPTIONS);

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
        actorOptions,
        countryOptions,
        crisisOptions,
        disasterCategoryOptions,
        disasterSubCategoryOptions,
        disasterTypeOptions,
        triggerOptions,
        violenceOptions,
        eventTypeOptions,
        violenceSubTypeOptions,
        triggerSubTypeOptions,
    ] = React.useMemo(() => ([
        data?.actorList ?? emptyList,
        data?.countryList?.results ?? emptyList,
        data?.crisisList?.results ?? emptyList,
        data?.disasterCategoryList ?? emptyList,
        data?.disasterSubCategoryList ?? emptyList,
        data?.disasterTypeList ?? emptyList,
        data?.triggerList ?? emptyList,
        data?.violenceList ?? emptyList,
        data?.__type?.enumValues ?? emptyList,
        listToMap(data?.violenceList ?? emptyList, basicEntityKeySelector, subTypesSelector),
        listToMap(data?.triggerList ?? emptyList, basicEntityKeySelector, subTypesSelector),
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

    const handleAddCrisisButtonClick = React.useCallback(() => {
        setShowCrisisFormModal(true);
    }, [setShowCrisisFormModal]);

    const handleCrisisFormModalClose = React.useCallback(() => {
        setShowCrisisFormModal(false);
    }, [setShowCrisisFormModal]);

    const handleCrisisCreate = React.useCallback((newCrisisId) => {
        refetchEventOptions();
        onValueChange(newCrisisId, 'crisis');
        setShowCrisisFormModal(false);
    }, [refetchEventOptions, onValueChange, setShowCrisisFormModal]);

    return (
        <>
            <form
                className={styles.eventForm}
                onSubmit={onFormSubmit}
            >
                <div className={styles.crisisRow}>
                    <SelectInput
                        className={styles.crisisSelectInput}
                        label="Crisis *"
                        name="crisis"
                        options={crisisOptions}
                        value={value.crisis}
                        error={error?.fields?.crisis}
                        onChange={onValueChange}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                    />
                    <Button
                        onClick={handleAddCrisisButtonClick}
                        className={styles.addCrisisButton}
                    >
                        Add Crisis
                    </Button>
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
                        options={eventTypeOptions}
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
                <div className={styles.twoColumnRow}>
                    <SelectInput
                        options={triggerOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Trigger"
                        name="trigger"
                        value={value.trigger}
                        onChange={onValueChange}
                        error={error?.fields?.trigger}
                    />
                    <SelectInput
                        options={triggerSubTypeOptions[value.trigger] || []}
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
                        options={violenceOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Type of Violence"
                        name="violence"
                        value={value.violence}
                        onChange={onValueChange}
                    />
                    <SelectInput
                        options={violenceSubTypeOptions[value.violence] || []}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Sub-type"
                        name="violenceSubType"
                        value={value.violenceSubType}
                        onChange={onValueChange}
                    />
                </div>
                <div className={styles.twoColumnRow}>
                    <SelectInput
                        options={actorOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Actor"
                        name="actor"
                        value={value.actor}
                        onChange={onValueChange}
                    />
                    <MultiSelectInput
                        options={countryOptions}
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
                    <Button type="submit">
                        Submit
                    </Button>
                </div>
            </form>
            { showCrisisFormModal && (
                <Modal
                    onClose={handleCrisisFormModalClose}
                    heading="Add Crisis"
                >
                    <CrisisForm onCrisisCreate={handleCrisisCreate} />
                </Modal>
            )}
        </>
    );
}

export default EventForm;
