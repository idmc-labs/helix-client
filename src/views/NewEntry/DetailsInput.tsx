import React from 'react';
import { IoIosSearch } from 'react-icons/io';
import {
    SelectInput,
    TextInput,
    Modal,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';

import EventForm from '#components/EventForm';

import {
    DetailsFormProps,
    BasicEntity,
} from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import styles from './styles.css';

interface DetailsOptionsFields {
    eventList: {
        results: BasicEntity[];
    };
}

const DETAILS_OPTIONS = gql`
    query DetailsOptions {
        eventList {
            results {
                id
                name
            }
        }
    }
`;

interface DetailsInputProps<K extends string> {
    name: K;
    value: DetailsFormProps;
    error: Error<DetailsFormProps> | undefined;
    onChange: (value: DetailsFormProps, name: K) => void;
}

const emptyList: unknown[] = [];

function DetailsInput<K extends string>(props: DetailsInputProps<K>) {
    const {
        name,
        value,
        onChange,
        error,
    } = props;

    const [showAddEventModal, setShowAddEventModal] = React.useState(false);

    const onValueChange = useFormObject<K, DetailsFormProps>(name, value, onChange);
    const handleAddEventButtonClick = React.useCallback(() => {
        setShowAddEventModal(true);
    }, [setShowAddEventModal]);

    const handleAddEventModalClose = React.useCallback(() => {
        setShowAddEventModal(false);
    }, [setShowAddEventModal]);

    const {
        data,
        refetch: refetchDetailOptions,
    } = useQuery<DetailsOptionsFields>(DETAILS_OPTIONS);

    const handleEventCreate = React.useCallback((newEventId) => {
        refetchDetailOptions();
        onValueChange(newEventId, 'event');
        setShowAddEventModal(false);
    }, [refetchDetailOptions, onValueChange, setShowAddEventModal]);

    return (
        <>
            <div className={styles.eventRow}>
                <SelectInput
                    className={styles.eventSelectInput}
                    error={error?.fields?.event}
                    keySelector={basicEntityKeySelector}
                    label="Event *"
                    labelSelector={basicEntityLabelSelector}
                    name="event"
                    onChange={onValueChange}
                    options={data?.eventList?.results ?? emptyList as BasicEntity[]}
                    value={value.event}
                />
                <Button
                    name={undefined}
                    className={styles.addEventButton}
                    onClick={handleAddEventButtonClick}
                >
                    Add Event
                </Button>
            </div>
            <div className={styles.row}>
                <TextInput
                    icons={<IoIosSearch />}
                    label="Url"
                    value={value.url}
                    onChange={onValueChange}
                    name="url"
                    error={error?.fields?.url}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Article Title *"
                    onChange={onValueChange}
                    value={value.articleTitle}
                    name="articleTitle"
                    error={error?.fields?.articleTitle}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Source*"
                    onChange={onValueChange}
                    value={value.source}
                    name="source"
                    error={error?.fields?.source}
                />
                <TextInput
                    label="Publisher*"
                    onChange={onValueChange}
                    name="publisher"
                    value={value.publisher}
                    error={error?.fields?.publisher}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Publication Date*"
                    onChange={onValueChange}
                    value={value.publishDate}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Methodology"
                    onChange={onValueChange}
                    value={value.sourceMethodology}
                    name="sourceMethodology"
                    error={error?.fields?.sourceMethodology}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Excerpt Methodology"
                    onChange={onValueChange}
                    value={value.excerptMethodology}
                    name="excerptMethodology"
                    error={error?.fields?.excerptMethodology}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Breakdown and Reliability"
                    onChange={onValueChange}
                    value={value.sourceBreakdown}
                    name="sourceBreakdown"
                    error={error?.fields?.sourceBreakdown}
                />
            </div>
            { showAddEventModal && (
                <Modal
                    heading="Add Event"
                    onClose={handleAddEventModalClose}
                >
                    <EventForm
                        onEventCreate={handleEventCreate}
                    />
                </Modal>
            )}
        </>
    );
}

export default DetailsInput;
