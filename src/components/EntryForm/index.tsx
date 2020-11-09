import React, { useCallback } from 'react';
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
import { transformToFormError } from '#utils/errorTransform';
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
    PartialForm,
} from '#types';

import {
    EventsForEntryFormQuery,
    CreateEntryMutation,
    CreateEntryMutationVariables,
    CreateAttachmentMutation,
    CreateAttachmentMutationVariables,
} from '#generated/types';

import DetailsInput from './DetailsInput';
import AnalysisInput from './AnalysisInput';
import FigureInput from './FigureInput';
import ReviewInput from './ReviewInput';
import {
    FormType,
    FormValues,
    StrataFormProps,
    AgeFormProps,
    FigureFormProps,
    Attachment,
    Preview,
} from './types';

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
        createEntry(data: $entry) {
            result {
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

const ATTACHMENT = gql`
    mutation CreateAttachment($attachment: Upload!) {
        createAttachment(data: {attachment: $attachment, attachmentFor: "0"}) {
            errors {
                field
                messages
            }
            ok
            result {
                attachment
                attachmentFor
                createdAt
                id
            }
        }
    }
`;

type PartialFormValues = PartialForm<FormValues>;

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
                document: [],
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
        document: '',
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

    attachment?: Attachment;
    preview?: Preview;
    onAttachmentChange: (value: Attachment) => void;
    onPreviewChange: (value: Preview) => void;
}

function EntryForm(props: EntryFormProps) {
    const {
        className,
        elementRef,
        onChange,
        value: valueFromProps = initialFormValues,

        attachment,
        preview,
        onAttachmentChange: setAttachment,
        onPreviewChange: setPreview,
    } = props;

    const urlProcessed = !!preview;
    const attachmentProcessed = !!attachment;
    const processed = attachmentProcessed || urlProcessed;

    const {
        value,
        error,
        onValueChange,
        onValueSet,
        onErrorSet,
        validate,
    } = useForm(valueFromProps, schema);

    React.useEffect(() => {
        onChange(value);
    }, [value, onChange]);

    const [
        createAttachment,
    ] = useMutation<CreateAttachmentMutation, CreateAttachmentMutationVariables>(
        ATTACHMENT,
        {
            onCompleted: (response) => {
                const { createAttachment: createAttachmentRes } = response;
                if (!createAttachmentRes) {
                    return;
                }
                const { errors, result } = createAttachmentRes;
                if (errors) {
                    // TODO: handle error
                    console.error(errors);
                }
                if (result) {
                    setAttachment(result);
                    onValueSet({
                        ...value,
                        details: {
                            ...value.details,
                            document: result.id,
                        },
                    });
                }
            },
        },
        // TODO: handle error
    );

    const [
        createEntry,
        { loading: saveLoading },
    ] = useMutation<CreateEntryMutation, CreateEntryMutationVariables>(
        CREATE_ENTRY,
        {
            onCompleted: (response) => {
                const { createEntry: createEntryRes } = response;
                if (!createEntryRes) {
                    return;
                }
                const { errors } = createEntryRes;
                if (errors) {
                    const formError = transformToFormError(errors);
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

    const handleUrlProcess = useCallback(
        (url: string) => {
            // TODO: need to call server-less and get real preview object
            setPreview({ url });
            // TODO: also set preview on form
        },
        [setPreview],
    );

    const handleAttachmentProcess = useCallback(
        (files: File[]) => {
            createAttachment({
                variables: { attachment: files[0] },
                context: {
                    hasUpload: true, // activate Upload link
                },
            });
            // TODO: also set attachment on form
        },
        [createAttachment],
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
                entry: entry as FormType,
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
    } = useQuery<EventsForEntryFormQuery>(EVENT_LIST);

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
            includeIdu: false,
            isDisaggregated: false,
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
                        <>
                            <DetailsInput
                                name="details"
                                value={value.details}
                                onChange={onValueChange}
                                error={error?.fields?.details}
                                disabled={loading}
                                urlProcessed={urlProcessed}
                                attachment={attachment}
                                onAttachmentProcess={handleAttachmentProcess}
                                onUrlProcess={handleUrlProcess}
                            />
                        </>
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
                                    disabled={loading || !processed}
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
                                    disabled={loading || !processed}
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
                                disabled={loading || !processed}
                            />
                        </Section>
                        <Section
                            heading="Figures"
                            actions={(
                                <Button
                                    name={undefined}
                                    className={styles.addButton}
                                    onClick={handleFigureAdd}
                                    disabled={loading || !processed}
                                >
                                    Add Figure
                                </Button>
                            )}
                        >
                            {error?.fields?.figures?.$internal && (
                                <p>
                                    {error?.fields?.figures?.$internal}
                                </p>
                            )}
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
                                    disabled={loading || !processed}
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
                            disabled={loading || !processed}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </form>
    );
}

export default EntryForm;
