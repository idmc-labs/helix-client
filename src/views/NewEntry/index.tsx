import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { v4 as uuidv4 } from 'uuid';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    SelectInput,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

import Section from '#components/Section';
import PageHeader from '#components/PageHeader';
import EventForm from '#components/EventForm';
import useForm, { useFormArray } from '#utils/form';
import type { Schema } from '#utils/schema';
import useModalState from '#hooks/useModalState';
import {
    requiredStringCondition,
    urlCondition,
} from '#utils/validation';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import {
    DetailsFormProps,
    AnalysisFormProps,
    FigureFormProps,
    AgeFields,
    StrataFields,
    BasicEntity,
} from '#types';

import DetailsInput from './DetailsInput';
import AnalysisInput from './AnalysisInput';
import FigureInput from './FigureInput';
import ReviewInput from './ReviewInput';

import styles from './styles.css';

const emptyList: unknown[] = [];

const EVENT_LIST = gql`
    query EventList {
        eventList {
            results {
                id
                name
            }
        }
    }
`;

const CREATE_ENTRY = gql`
    mutation CreateEntry($entry: EntryCreateInputType!){
        createEntry(entry: $entry) {
            entry {
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

interface FormValues {
    event: string;
    details: DetailsFormProps;
    analysis: AnalysisFormProps;
    figures: FigureFormProps[];
}

interface EventListResponseFields {
    eventList: {
        results: BasicEntity[];
    };
}

const schema: Schema<FormValues> = {
    fields: () => ({
        event: [requiredStringCondition],
        details: {
            fields: () => ({
                articleTitle: [requiredStringCondition],
                excerptMethodology: [],
                publishDate: [requiredStringCondition],
                publisher: [requiredStringCondition],
                source: [requiredStringCondition],
                sourceBreakdown: [],
                sourceExcerpt: [],
                sourceMethodology: [],
                url: [urlCondition],
            }),
        },
        analysis: {
            fields: () => ({
                idmcAnalysis: [],
                methodology: [],
                tags: [],
            }),
        },
        figures: {
            keySelector: (figure) => figure.uuid,
            member: () => ({
                fields: (value) => {
                    const basicFields = {
                        districts: [],
                        excerptIdu: [],
                        householdSize: [],
                        includeIdu: [],
                        isDisaggregated: [],
                        locationCamp: [],
                        locationNonCamp: [],
                        quantifier: [],
                        reported: [],
                        role: [],
                        startDate: [],
                        term: [],
                        town: [],
                        type: [],
                        unit: [],
                        uuid: [],
                    };

                    const disaggregatedFields = {
                        ageJson: {
                            keySelector: (age: AgeFields) => age.uuid,
                            member: () => ({
                                fields: () => ({
                                    uuid: [],
                                    ageFrom: [requiredStringCondition],
                                    ageTo: [requiredStringCondition],
                                    value: [requiredStringCondition],
                                }),
                            }),
                        },
                        conflict: [],
                        conflictCommunal: [],
                        conflictCriminal: [],
                        conflictOther: [],
                        conflictPolitical: [],
                        displacementRural: [],
                        displacementUrban: [],
                        sexFemale: [],
                        sexMale: [],
                        strataJson: {
                            keySelector: (strata: StrataFields) => strata.uuid,
                            member: () => ({
                                fields: () => ({
                                    uuid: [],
                                    date: [requiredStringCondition],
                                    value: [requiredStringCondition],
                                }),
                            }),
                        },
                    };

                    if (value.isDisaggregated) {
                        return {
                            ...basicFields,
                            ...disaggregatedFields,
                        };
                    }

                    return basicFields;
                },
            }),
        },
    }),
};

const defaultFigureValue = {
    districts: '',
    ageJson: [],
    includeIdu: false,
    isDisaggregated: false,
    role: '',
    startDate: '',
    strataJson: [],
    term: '',
    town: '',
    type: '',
    unit: '',
    quantifier: undefined,
};

const initialFormValues: FormValues = {
    event: '',
    details: {
        url: '',
        articleTitle: '',
        source: '',
        publisher: '',
        publishDate: '',
        sourceMethodology: '',
        excerptMethodology: '',
        sourceExcerpt: '',
        sourceBreakdown: '',
    },
    analysis: {
        idmcAnalysis: '',
        methodology: '',
        tags: [],
    },
    figures: [],
};

interface NewEntryProps {
    className?: string;
}

function NewEntry(props: NewEntryProps) {
    const { className } = props;

    const [createNewEntry] = useMutation(
        CREATE_ENTRY,
        {
            onCompleted: (response) => {
                if (response.errors) {
                    console.error(response.errors);
                } else {
                    console.warn('create new entry done', response);
                }
            },
        },
    );

    const handleSubmit = React.useCallback((finalValue: FormValues) => {
        const {
            articleTitle,
            publishDate,
            publisher,
            source,
        } = finalValue.details;

        const entry = {
            articleTitle,
            source,
            publisher,
            publishDate,
            event: finalValue.event,
            figures: finalValue.figures,
            ...finalValue.analysis,
        };

        createNewEntry({
            variables: {
                entry,
            },
        });
    }, [createNewEntry]);

    const {
        value,
        error,
        onValueChange,
        onFormSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    const [
        shouldShowEventModal,
        showEventModal,
        hideEventModal,
    ] = useModalState();

    const {
        data,
        refetch: refetchDetailOptions,
    } = useQuery<EventListResponseFields>(EVENT_LIST);

    const eventList = data?.eventList?.results ?? emptyList as BasicEntity[];

    const handleEventCreate = React.useCallback((newEventId) => {
        refetchDetailOptions();
        onValueChange(newEventId, 'event');
        hideEventModal();
    }, [refetchDetailOptions, onValueChange, hideEventModal]);

    const {
        onValueChange: onFigureChange,
        onValueRemove: onFigureRemove,
    } = useFormArray('figures', value.figures, onValueChange);

    const handleFigureAdd = () => {
        const uuid = uuidv4();
        const newFigure: FigureFormProps = {
            uuid,
            ...defaultFigureValue,
        };
        onValueChange(
            [...value.figures, newFigure],
            'figures',
        );
    };

    const [activeTab, setActiveTab] = React.useState<'details' | 'analysis-and-figures' | 'review'>('details');

    return (
        <>
            <form
                className={_cs(className, styles.newEntry)}
                onSubmit={onFormSubmit}
            >
                <PageHeader
                    title="New Entry"
                    actions={(
                        <div className={styles.actions}>
                            <Button
                                name={undefined}
                                type="submit"
                                variant="primary"
                            >
                                Submit entry
                            </Button>
                        </div>
                    )}
                />
                <div className={styles.content}>
                    <div className={styles.mainContent}>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                        >
                            <TabList>
                                <Tab name="details">
                                    Source Details
                                </Tab>
                                <Tab name="analysis-and-figures">
                                    Figure and Analysis
                                </Tab>
                                <Tab name="review">
                                    Review
                                </Tab>
                            </TabList>
                            <TabPanel
                                className={styles.details}
                                name="details"
                            >
                                <DetailsInput
                                    name="details"
                                    value={value.details}
                                    onChange={onValueChange}
                                    error={error?.fields?.details}
                                />
                            </TabPanel>
                            <TabPanel
                                className={styles.analysisAndFigures}
                                name="analysis-and-figures"
                            >
                                <Section
                                    heading="Event"
                                    actions={(
                                        <Button
                                            name={undefined}
                                            className={styles.addEventButton}
                                            onClick={showEventModal}
                                        >
                                            Add Event
                                        </Button>
                                    )}
                                >
                                    <div className={styles.row}>
                                        <SelectInput
                                            className={styles.eventSelectInput}
                                            error={error?.fields?.event}
                                            keySelector={basicEntityKeySelector}
                                            label="Event *"
                                            labelSelector={basicEntityLabelSelector}
                                            name="event"
                                            onChange={onValueChange}
                                            options={eventList}
                                            value={value.event}
                                        />
                                    </div>
                                    { shouldShowEventModal && (
                                        <Modal
                                            className={styles.addEventModal}
                                            bodyClassName={styles.body}
                                            heading="Add Event"
                                            onClose={hideEventModal}
                                        >
                                            <EventForm onEventCreate={handleEventCreate} />
                                        </Modal>
                                    )}
                                </Section>
                                <Section heading="Analysis">
                                    <AnalysisInput
                                        name="analysis"
                                        value={value.analysis}
                                        onChange={onValueChange}
                                        error={error?.fields?.analysis}
                                    />
                                </Section>
                                <Section
                                    heading="Figures"
                                    actions={(
                                        <Button
                                            name={undefined}
                                            className={styles.addButton}
                                            onClick={handleFigureAdd}
                                        >
                                            Add Figure
                                        </Button>
                                    )}
                                >
                                    { value.figures.length === 0 ? (
                                        <div className={styles.emptyMessage}>
                                            No figures yet
                                        </div>
                                    ) : value.figures.map((figure, index) => (
                                        <FigureInput
                                            key={figure.uuid}
                                            index={index}
                                            value={figure}
                                            onChange={onFigureChange}
                                            onRemove={onFigureRemove}
                                            error={error?.fields?.figures?.members?.[figure.uuid]}
                                        />
                                    ))}
                                </Section>
                            </TabPanel>
                            <TabPanel
                                className={styles.review}
                                name="review"
                            >
                                <ReviewInput />
                            </TabPanel>
                        </Tabs>
                    </div>
                    <aside className={styles.sideContent}>
                        Aside
                    </aside>
                </div>
            </form>
        </>
    );
}

export default NewEntry;
