import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import PageHeader from '#components/PageHeader';
import useForm, { useFormArray } from '#utils/form';
import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    urlCondition,
} from '#utils/validation';
import CrisisForm from '#components/CrisisForm';

import SourceDetailsInput, { SourceDetailsFormProps } from './SourceDetailsInput';
import CrisisDetailsInput, { CrisisDetailsFormProps } from './CrisisDetailsInput';
import EventDetailsInput, { EventDetailsFormProps } from './EventDetailsInput';
import AnalysisInput, { AnalysisFormProps } from './AnalysisInput';
import FigureInput, { FigureFormProps } from './FigureInput';
import ReviewInput from './ReviewInput';

import styles from './styles.css';

const ENTRY_OPTIONS = gql`
    query EntryOptions {
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
        __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
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
    sourceDetails: SourceDetailsFormProps;
    crisisDetails: CrisisDetailsFormProps;
    eventDetails: EventDetailsFormProps;
    analysis: AnalysisFormProps;
    figures: FigureFormProps[];
}

const schema: Schema<FormValues> = {
    fields: () => ({
        sourceDetails: {
            fields: () => ({
                articleTitle: [requiredStringCondition],
                confidential: [],
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
        crisisDetails: {
            fields: () => ({
                noCrisisAssociated: [],
                countries: {
                    keySelector: (d) => d,
                    member: [],
                },
                crisisType: [],
                crisis: [],
                crisisNarrative: [],
            }),
        },
        eventDetails: {
            fields: () => ({
                eventName: [],
                sameAsCrisis: [],
                eventType: [],
                glideNumber: [],
                trigger: [],
                triggerSubType: [],
                violence: [],
                violenceSubType: [],
                actors: {
                    keySelector: (d) => d,
                    member: () => ({
                        fields: () => ({
                            id: [],
                        }),
                    }),
                },
                countries: {
                    keySelector: (d) => d,
                    member: () => ({
                        fields: () => ({
                            id: [],
                        }),
                    }),
                },
                endDate: [],
                name: [],
                eventNarrative: [],
            }),
        },
        analysis: {
            fields: () => ({
                idmcAnalysis: [],
                methodology: [],
                caveats: [],
                saveTo: [],
                tags: {
                    keySelector: (d) => d,
                    member: () => ({
                        fields: () => ({
                            id: [],
                        }),
                    }),
                },
            }),
        },
        figures: {
            keySelector: (figure) => figure.id,
            member: () => ({
                fields: () => ({
                    id: [],
                    districts: {
                        keySelector: (d) => d,
                        member: () => ({
                            fields: () => ({
                                id: [],
                            }),
                        }),
                    },
                    town: [],
                    quantifier: [],
                    reportedFigure: [],
                    unit: [],
                    term: [],
                    figureType: [],
                    role: [],
                    disaggregatedData: [],
                    totalFigure: [],
                    startDate: [],
                    endDate: [],
                    includeInIdu: [],
                    excerptForIdu: [],
                }),
            }),
        },
    }),
};

const defaultFigureValue = {
    districts: [],
    town: '',
    quantifier: '',
    reportedFigure: '',
    unit: '',
    term: '',
    figureType: '',
    role: '',
    disaggregatedData: false,
    totalFigure: '',
    startDate: '',
    endDate: '',
    includeInIdu: false,
    excerptForIdu: '',
};

const initialFormValues: FormValues = {
    sourceDetails: {
        confidential: false,
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
    crisisDetails: {
        noCrisisAssociated: false,
        countries: [],
        crisisType: '',
        crisis: '',
        crisisNarrative: '',
    },
    eventDetails: {
        name: '',
        sameAsCrisis: false,
        eventType: '',
        glideNumber: '',
        trigger: '',
        triggerSubType: '',
        violence: '',
        violenceSubType: '',
        actors: [],
        countries: [],
        startDate: '',
        endDate: '',
        eventNarrative: '',
    },
    analysis: {
        idmcAnalysis: '',
        methodology: '',
        caveats: '',
        saveTo: '',
        tags: [],
    },
    figures: [
        {
            id: 1,
            ...defaultFigureValue,
        },
    ],
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
                console.warn('create new entry done', response);
            },
        },
    );
    const { data } = useQuery(ENTRY_OPTIONS);
    const [
        countryOptions,
        crisisTypeOptions,
        crisisOptions,
    ] = React.useMemo(() => ([
        data?.countryList?.results || [],
        data?.__type?.enumValues || [],
        data?.crisisList?.results || [],
    ]), [data]);

    console.info(data);

    const handleSubmit = React.useCallback((finalValue: FormValues) => {
        const {
            articleTitle,
            source,
            publisher,
            publishDate,
        } = finalValue.sourceDetails;

        const entry = {
            articleTitle,
            source,
            publisher,
            publishDate,
            event: 1,
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
        onSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    const {
        onValueChange: onFigureChange,
        onValueRemove: onFigureRemove,
    } = useFormArray('figures', value.figures, onValueChange);

    const handleFigureAdd = () => {
        const id = new Date().getTime();
        const newFigure = {
            id,
            ...defaultFigureValue,
        };
        onValueChange(
            [...value.figures, newFigure],
            'figures',
        );
    };

    const [activeTab, setActiveTab] = React.useState<'source-details' | 'crisis-details' | 'review'>('review');

    return (
        <>
            <form
                className={_cs(className, styles.newEntry)}
                onSubmit={onSubmit}
            >
                <PageHeader
                    title="New Entry"
                    actions={(
                        <Button onClick={onSubmit}>
                            Submit entry
                        </Button>
                    )}
                />
                <div className={styles.content}>
                    <div className={styles.mainContent}>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                        >
                            <TabList>
                                <Tab name="source-details">
                                    Source Details
                                </Tab>
                                <Tab name="crisis-details">
                                    Crisis Details, Figure and Analysis
                                </Tab>
                                <Tab name="review">
                                    Review
                                </Tab>
                            </TabList>
                            <TabPanel
                                className={styles.sourceDetails}
                                name="source-details"
                            >
                                <SourceDetailsInput
                                    name="sourceDetails"
                                    value={value.sourceDetails}
                                    onChange={onValueChange}
                                    error={error?.fields?.sourceDetails}
                                />
                            </TabPanel>
                            <TabPanel
                                className={styles.crisisDetails}
                                name="crisis-details"
                            >
                                <CrisisDetailsInput
                                    name="crisisDetails"
                                    value={value.crisisDetails}
                                    onChange={onValueChange}
                                    error={error?.fields?.crisisDetails}
                                    countryOptions={countryOptions}
                                    crisisTypeOptions={crisisTypeOptions}
                                    crisisOptions={crisisOptions}
                                />
                                <hr />
                                <h3>
                                    Event details
                                </h3>
                                <EventDetailsInput
                                    name="eventDetails"
                                    value={value.eventDetails}
                                    onChange={onValueChange}
                                    error={error?.fields?.eventDetails}
                                />
                                { value.figures.length > 0 && (
                                    <>
                                        <hr />
                                        <h3>
                                            Figures
                                        </h3>
                                        <Button
                                            className={styles.addButton}
                                            onClick={handleFigureAdd}
                                        >
                                            Add Figure
                                        </Button>
                                        { value.figures.map((figure, index) => (
                                            <FigureInput
                                                key={figure.id}
                                                index={index}
                                                value={figure}
                                                onChange={onFigureChange}
                                                onRemove={onFigureRemove}
                                                error={error?.fields?.figures?.members?.[figure.id]}
                                            />
                                        ))}
                                    </>
                                )}
                                <hr />
                                <h3>
                                    Analysis
                                </h3>
                                <AnalysisInput
                                    name="analysis"
                                    value={value.analysis}
                                    onChange={onValueChange}
                                    error={error?.fields?.analysis}
                                />
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
            <CrisisForm />
        </>
    );
}

export default NewEntry;
