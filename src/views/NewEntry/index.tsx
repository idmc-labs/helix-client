import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import Header from '#components/Header';
import PageHeader from '#components/PageHeader';
import useForm, { useFormArray } from '#utils/form';
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    urlCondition,
} from '#utils/validation';
import CrisisForm from '#components/CrisisForm';
import EventForm from '#components/EventForm';

import {
    DetailsFormProps,
    AnalysisFormProps,
    FigureFormProps,
} from '#types';

import DetailsInput from './DetailsInput';
import AnalysisInput from './AnalysisInput';
import FigureInput from './FigureInput';
import ReviewInput from './ReviewInput';

import styles from './styles.css';

const ENTRY_OPTIONS = gql`
    query EntryOptions {
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
    details: DetailsFormProps;
    analysis: AnalysisFormProps;
    figures: FigureFormProps[];
}

const schema: Schema<FormValues> = {
    fields: () => ({
        details: {
            fields: () => ({
                articleTitle: [requiredStringCondition],
                event: [requiredStringCondition],
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
                fields: () => ({
                    ageJson: {
                        keySelector: (age) => age.uuid,
                        member: () => ({
                            fields: () => ({
                                uuid: [],
                                ageFrom: [],
                                ageTo: [],
                                value: [],
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
                    sexFemale: [],
                    sexMale: [],
                    startDate: [],
                    strataJson: [],
                    term: [],
                    town: [],
                    type: [],
                    unit: [],
                    uuid: [],
                }),
            }),
        },
    }),
};

const defaultFigureValue = {
    ageJson: [],
    conflict: '',
    conflictCommunal: '',
    conflictCriminal: '',
    conflictOther: '',
    conflictPolitical: '',
    displacementRural: '',
    displacementUrban: '',
    districts: '',
    excerptIdu: '',
    householdSize: '',
    includeIdu: false,
    isDisaggregated: false,
    locationCamp: '',
    locationNonCamp: '',
    quantifier: '',
    reported: '',
    role: '',
    sexFemale: '',
    sexMale: '',
    startDate: '',
    strataJson: [],
    term: '',
    town: '',
    type: '',
    unit: '',
};

const initialFormValues: FormValues = {
    details: {
        event: '',
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
    const [showAddCrisisModal, setShowAddCrisisModal] = React.useState(false);
    const [showAddEventModal, setShowAddEventModal] = React.useState(false);

    const [createNewEntry] = useMutation(
        CREATE_ENTRY,
        {
            onCompleted: (response) => {
                console.warn('create new entry done', response);
            },
        },
    );
    const {
        data,
        refetch,
    } = useQuery(ENTRY_OPTIONS);
    const eventOptions = React.useMemo(() => (
        data?.eventList?.results || []
    ), [data]);

    const handleSubmit = React.useCallback((finalValue: FormValues) => {
        const {
            articleTitle,
            event,
            publishDate,
            publisher,
            source,
        } = finalValue.details;

        const entry = {
            articleTitle,
            source,
            publisher,
            publishDate,
            event,
            figures: finalValue.figures,
            ...finalValue.analysis,
        };

        console.warn(entry);
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

    const handleCrisisCreate = React.useCallback((newCrisisId) => {
        console.info('new crisis created', newCrisisId);
    }, []);

    const {
        onValueChange: onFigureChange,
        onValueRemove: onFigureRemove,
    } = useFormArray('figures', value.figures, onValueChange);

    const handleEventCreate = React.useCallback((newEventId) => {
        refetch();
        onValueChange(
            {
                ...value.details,
                event: newEventId,
            },
            'details',
        );
    }, [refetch, onValueChange, value]);

    const handleFigureAdd = () => {
        const uuid = new Date().getTime().toString();
        const newFigure = {
            uuid,
            ...defaultFigureValue,
        };
        onValueChange(
            [...value.figures, newFigure],
            'figures',
        );
    };

    const [activeTab, setActiveTab] = React.useState<'details' | 'analysis-and-figures' | 'review'>('analysis-and-figures');

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
                            <Button onClick={() => setShowAddCrisisModal(true)}>
                                Add Crisis
                            </Button>
                            <Button onClick={() => setShowAddEventModal(true)}>
                                Add Event
                            </Button>
                            <Button
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
                                    eventOptions={eventOptions}
                                />
                            </TabPanel>
                            <TabPanel
                                className={styles.analysisAndFigures}
                                name="analysis-and-figures"
                            >
                                <Header heading="Analysis" />
                                <AnalysisInput
                                    name="analysis"
                                    value={value.analysis}
                                    onChange={onValueChange}
                                    error={error?.fields?.analysis}
                                />
                                <Header
                                    heading="Figures"
                                    actions={(
                                        <Button
                                            className={styles.addButton}
                                            onClick={handleFigureAdd}
                                        >
                                            Add Figure
                                        </Button>
                                    )}
                                />
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
            { showAddCrisisModal && (
                <Modal
                    heading="Add Crisis"
                    onClose={() => setShowAddCrisisModal(false)}
                >
                    <CrisisForm
                        onCrisisCreate={handleCrisisCreate}
                    />
                </Modal>
            )}
            { showAddEventModal && (
                <Modal
                    heading="Add Event"
                    onClose={() => setShowAddEventModal(false)}
                >
                    <EventForm
                        onEventCreate={handleEventCreate}
                    />
                </Modal>
            )}
        </>
    );
}

export default NewEntry;
