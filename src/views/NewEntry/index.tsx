import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from '@togglecorp/toggle-ui';

import SourceDetailsInput, { SourceDetailsFormProps } from './SourceDetailsInput';
import CrisisDetailsInput, { CrisisDetailsFormProps } from './CrisisDetailsInput';
import EventDetailsInput, { EventDetailsFormProps } from './EventDetailsInput';
import AnalysisInput, { AnalysisFormProps } from './AnalysisInput';
import FigureInput, { FigureFormProps } from './FigureInput';
import ReviewInput from './ReviewInput';

import PageHeader from '#components/PageHeader';
import useForm, { useFormArray } from '#utils/form';
import type { Schema } from '#utils/schema';

import styles from './styles.css';

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
                confidential: [],
                entryUrl: [],
                articleTitle: [],
                source: [],
                publisher: [],
                publicationDate: [],
                sourceMethodology: [],
                excerptMethodology: [],
                sourceExcerpt: [],
                sourceBreakdown: [],
            }),
        },
        crisisDetails: {
            fields: () => ({
                noCrisisAssociated: [],
                countries: [],
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
                    member: () => [],
                },
                countries: {
                    keySelector: (d) => d,
                    member: () => [],
                },
                startDate: [],
                endDate: [],
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
                    member: () => [],
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
                        member: () => [],
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
        entryUrl: '',
        articleTitle: '',
        source: '',
        publisher: '',
        publicationDate: '',
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
        eventName: '',
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

    const handleSubmit = React.useCallback((finalValue: FormValues) => {
        console.warn('Success', finalValue);
    }, []);

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

    const [activeTab, setActiveTab] = React.useState<'source-details' | 'crisis-details' | 'review'>('source-details');

    return (
        <form
            className={_cs(className, styles.newEntry)}
            onSubmit={onSubmit}
        >
            <PageHeader
                title="New Entry"
                actions={(
                    <Button type="submit">
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
                    Hello
                </aside>
            </div>
        </form>
    );
}

export default NewEntry;
