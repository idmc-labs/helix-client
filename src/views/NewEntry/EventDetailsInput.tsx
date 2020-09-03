import React from 'react';
import {
    TextInput,
    Checkbox,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { IoMdCalendar } from 'react-icons/io';

import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

export interface EventDetailsFormProps {
    name: string;
    sameAsCrisis: boolean;
    eventType: string;
    glideNumber: string;
    trigger: string;
    triggerSubType: string;
    violence: string;
    violenceSubType: string;
    actors: string[];
    countries: string[];
    startDate: string;
    endDate: string;
    eventNarrative: string;
}

interface EventDetailsInputProps<K extends string> {
    name: K;
    value: EventDetailsFormProps;
    error: Error<EventDetailsFormProps> | undefined;
    onChange: (value: EventDetailsFormProps, name: K) => void;
}

function EventDetailsInput<K extends string>(props: EventDetailsInputProps<K>) {
    const {
        name,
        value,
        onChange,
        error,
    } = props;

    const onValueChange = useFormObject<K, EventDetailsFormProps>(name, value, onChange);

    return (
        <>
            <div className={styles.row}>
                <TextInput
                    label="Event Name *"
                    className={styles.eventNameInput}
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                />
                <Checkbox
                    label="Same as crisis"
                    name="sameAsCrisis"
                    value={value.sameAsCrisis}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Event Type"
                    className={styles.eventTypeInput}
                    name="eventType"
                    value={value.eventType}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Glide Number"
                    className={styles.glideNumberInput}
                    name="glideNumber"
                    value={value.glideNumber}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Trigger"
                    className={styles.triggerInput}
                    name="trigger"
                    value={value.trigger}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Sub-type"
                    className={styles.triggerSubTypeInput}
                    name="triggerSubType"
                    value={value.triggerSubType}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Type of Violence"
                    className={styles.violenceTypeInput}
                    name="violence"
                    value={value.violence}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Sub-type"
                    className={styles.violenceSubTypeInput}
                    name="violenceSubType"
                    value={value.violenceSubType}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <MultiSelectInput
                    options={[]}
                    label="Actors"
                    className={styles.actorsInput}
                    name="actors"
                    value={value.actors}
                    onChange={onValueChange}
                />
                <MultiSelectInput
                    options={[]}
                    label="Country(ies)"
                    className={styles.actorCountriesInput}
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Start Date *"
                    className={styles.startDateInput}
                    actions={<IoMdCalendar />}
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                />
                <TextInput
                    label="End Date"
                    className={styles.endDateInput}
                    actions={<IoMdCalendar />}
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    className={styles.eventNarrativeInput}
                    placeholder="Event Narrative"
                    name="eventNarrative"
                    value={value.eventNarrative}
                    onChange={onValueChange}
                />
            </div>
        </>
    );
}

export default EventDetailsInput;
