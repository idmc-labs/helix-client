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
import EventForm from '#components/EventForm';
import useForm, { useFormArray, createSubmitHandler } from '#utils/form';
import { transformToFormError, ObjectError } from '#utils/errorTransform';
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
    StrataFormProps,
    AgeFormProps,

    BasicEntity,
    PartialForm,
    EntryFormFields,
} from '#types';

import DetailsInput from './DetailsInput';
import AnalysisInput from './AnalysisInput';
import FigureInput from './FigureInput';
import ReviewInput from './ReviewInput';

import styles from './styles.css';

const EVENT_LIST = gql`
    query EventsForEntryForm {
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
    reviewers: string[];
    event: string;
    details: DetailsFormProps;
    analysis: AnalysisFormProps;
    figures: FigureFormProps[];
}

interface EntryFields extends DetailsFormProps, AnalysisFormProps {
    event: string;
    figures: FigureFormProps[];
}

interface CreateEntryVariables {
    entry: EntryFields;
}

interface CreateEntryResponseFields {
    errors?: string[];
    createEntry: {
        errors?: ObjectError[];
    }
}

type PartialFormValues = PartialForm<EntryFormFields>;

interface EventListResponseFields {
    eventList: {
        results: BasicEntity[];
    };
}

const schema: Schema<PartialFormValues> = {
    fields: () => ({
        reviewers: [],
        event: [requiredStringCondition],
        details: {
            fields: () => ({
                articleTitle: [requiredStringCondition],
                // excerptMethodology: [],
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
                idmcAnalysis: [requiredStringCondition],
                methodology: [requiredStringCondition],
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
                            keySelector: (age: AgeFormProps) => age.uuid,
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
                            keySelector: (strata: StrataFormProps) => strata.uuid,
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

const initialFormValues: PartialFormValues = {
    event: '',
    reviewers: [],
    details: {
        url: '',
        articleTitle: '',
        source: '',
        publisher: '',
        publishDate: '',
        sourceMethodology: '',
        // excerptMethodology: '',
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

interface EntryFormProps {
    className?: string;
    elementRef: React.RefObject<HTMLFormElement>;
    value?: PartialFormValues;
    onChange: (newValue: PartialFormValues | undefined) => void;
}

function EntryForm(props: EntryFormProps) {
    const {
        className,
        elementRef,
        onChange,
        value: valueFromProps = initialFormValues,
    } = props;
    const [urlProcessed, setUrlProcessed] = React.useState(false);

    const {
        value,
        error,
        onValueChange,
        onErrorSet,
        validate,
    } = useForm(valueFromProps, schema);

    React.useEffect(() => {
        onChange(value);
    }, [value, onChange]);

    const [
        createEntry,
        { loading: saveLoading },
    ] = useMutation<CreateEntryResponseFields, CreateEntryVariables>(
        CREATE_ENTRY,
        {
            onCompleted: (response) => {
                if (response.createEntry.errors) {
                    const formError = transformToFormError(response.createEntry.errors);
                    onErrorSet(formError);
                } else {
                    console.warn('create new entry done', response);
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValue: PartialFormValues) => {
        const completeValue = finalValue as FormValues;

        const entry = {
            event: completeValue.event,
            reviewers: completeValue.reviewers,
            figures: completeValue.figures,
            ...completeValue.analysis,
            ...completeValue.details,
        };

        createEntry({
            variables: {
                entry,
            },
        });
    }, [createEntry]);

    const [
        shouldShowEventModal,
        showEventModal,
        hideEventModal,
    ] = useModalState();

    const {
        data,
        refetch: refetchDetailOptions,
        loading: eventOptionsLoading,
    } = useQuery<EventListResponseFields>(EVENT_LIST);

    const loading = saveLoading || eventOptionsLoading;
    const eventList = data?.eventList?.results;

    const handleEventCreate = React.useCallback((newEventId) => {
        refetchDetailOptions();
        onValueChange(newEventId, 'event' as const);
        hideEventModal();
    }, [refetchDetailOptions, onValueChange, hideEventModal]);

    const {
        onValueChange: onFigureChange,
        onValueRemove: onFigureRemove,
    } = useFormArray('figures', value.figures ?? [], onValueChange);

    const handleFigureAdd = () => {
        const uuid = uuidv4();
        const newFigure: PartialForm<FigureFormProps> = {
            uuid,
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
        onValueChange(
            [...(value.figures ?? []), newFigure],
            'figures' as const,
        );
    };

    const [activeTab, setActiveTab] = React.useState<'details' | 'analysis-and-figures' | 'review'>('details');
    // const url = value?.details?.url;

    return (
        <form
            className={_cs(className, styles.entryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            ref={elementRef}
        >
            {error?.$internal && (
                <div className={styles.internalError}>
                    {error?.$internal}
                </div>
            )}
            <div className={styles.content}>
                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                >
                    <TabList className={styles.tabList}>
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
                            disabled={loading}
                            urlProcessed={urlProcessed}
                            setUrlProcessed={setUrlProcessed}
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
                                    disabled={loading || !urlProcessed}
                                >
                                    Add Event
                                </Button>
                            )}
                        >
                            <div className={styles.row}>
                                <SelectInput
                                    className={styles.eventSelectInput}
                                    error={error?.fields?.event}
                                    label="Event *"
                                    keySelector={basicEntityKeySelector}
                                    labelSelector={basicEntityLabelSelector}
                                    name="event"
                                    options={eventList}
                                    value={value.event}
                                    onChange={onValueChange}
                                    disabled={loading || !urlProcessed}
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
                            {value.event && (
                                <EventForm
                                    id={value.event}
                                    readOnly
                                />
                            )}
                        </Section>
                        <Section heading="Analysis">
                            <AnalysisInput
                                name="analysis"
                                value={value.analysis}
                                onChange={onValueChange}
                                error={error?.fields?.analysis}
                                disabled={loading || !urlProcessed}
                            />
                        </Section>
                        <Section
                            heading="Figures"
                            actions={(
                                <Button
                                    name={undefined}
                                    className={styles.addButton}
                                    onClick={handleFigureAdd}
                                    disabled={loading || !urlProcessed}
                                >
                                    Add Figure
                                </Button>
                            )}
                        >
                            { value.figures?.length === 0 ? (
                                <div className={styles.emptyMessage}>
                                    No figures yet
                                </div>
                            ) : value.figures?.map((figure, index) => (
                                <FigureInput
                                    key={figure.uuid}
                                    index={index}
                                    value={figure}
                                    onChange={onFigureChange}
                                    onRemove={onFigureRemove}
                                    error={error?.fields?.figures?.members?.[figure.uuid]}
                                    disabled={loading || !urlProcessed}
                                />
                            ))}
                        </Section>
                    </TabPanel>
                    <TabPanel
                        className={styles.review}
                        name="review"
                    >
                        <ReviewInput
                            name="reviewers"
                            onChange={onValueChange}
                            value={value.reviewers}
                            disabled={loading || !urlProcessed}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </form>
    );
}

export default EntryForm;
