import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { removeNull } from '@togglecorp/toggle-form';
import {
    isDefined,
    unique,
    _cs,
} from '@togglecorp/fujs';
import {
    Tab,
    TabPanel,
    Tabs,
} from '@togglecorp/toggle-ui';

import {
    FIGURE_LIST,
    FIGURE_OPTIONS,
} from '#views/Entry/EntryForm/queries';
import {
    FigureListQuery,
    FigureListQueryVariables,
    FigureOptionsForEntryFormQuery,
} from '#generated/types';
import {
    Attachment,
    SourcePreview,
} from '#views/Entry/EntryForm/types';
import EventForm from '#components/forms/EventForm';
import PageHeader from '#components/PageHeader';
import { EventListOption } from '#components/selections/EventListSelectInput';
import { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import { ViolenceContextOption } from '#components/selections/ViolenceContextMultiSelectInput';
import { OrganizationOption } from '#components/selections/OrganizationSelectInput';
import Preview from '#components/Preview';
import FigureInput from '#components/FigureInput';

import styles from './styles.css';

const mode = 'view';
const trafficLightShown = mode === 'view';

function transform(figures: NonNullable<FigureListQuery['figureList']>['results']) {
    const transformedFigures = figures?.map((figure) => ({
        ...figure,
        event: figure.event?.id,
        country: figure.country?.id,
        geoLocations: figure.geoLocations?.results,
        tags: figure.tags?.map((tag) => tag.id),
        sources: figure.sources?.results?.map((item) => item.id),
        disaggregationAge: figure.disaggregationAge?.results,
        disasterSubType: figure.disasterSubType?.id,
        violenceSubType: figure.violenceSubType?.id,
        osvSubType: figure.osvSubType?.id,
        otherSubType: figure.otherSubType?.id,
        contextOfViolence: figure.contextOfViolence?.map((c) => c.id),
    })) ?? [];
    return removeNull(transformedFigures);
}
interface Props {
    className: string;
}

function EventReview(props: Props) {
    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    const { className } = props;
    const { eventId } = useParams<{ eventId?: string }>();
    const [selectedFigure, setSelectedFigure] = useState<string | undefined>();
    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<SourcePreview | undefined>(undefined);
    const [
        events,
        setEvents,
    ] = useState<EventListOption[] | null | undefined>([]);
    const [
        tagOptions,
        setTagOptions,
    ] = useState<FigureTagOption[] | undefined | null>();
    const [
        violenceContextOptions,
        setViolenceContextOptions,
    ] = useState<ViolenceContextOption[] | null | undefined>();
    const [
        organizations,
        setOrganizations,
    ] = useState<OrganizationOption[] | null | undefined>([]);

    const [value, setValue] = useState<ReturnType<typeof transform>>([]);

    const figureId = useMemo(
        () => {
            const params = new URLSearchParams(document.location.search);
            return params.get('id');
        },
        [],
    );

    const variables = useMemo(
        (): FigureListQueryVariables | undefined => (
            eventId ? { id: eventId } : undefined
        ),
        [eventId],
    );

    const {
        loading: getFiguresLoading,
        error: eventDataError,
    } = useQuery<FigureListQuery, FigureListQueryVariables>(FIGURE_LIST, {
        skip: !variables,
        variables,
        onCompleted: (response) => {
            const { figureList } = removeNull(response);
            setEvents(figureList?.results?.map((item) => item.event).filter(isDefined));

            const mainFigure = figureList?.results?.find((element) => element.id === figureId);
            setSelectedFigure(mainFigure?.uuid);

            setTagOptions(figureList?.results?.flatMap((item) => item.tags).filter(isDefined));

            setViolenceContextOptions(
                figureList?.results?.flatMap((item) => item.contextOfViolence).filter(isDefined),
            );
            const organizationsFromEntry: OrganizationOption[] = [];

            organizationsFromEntry.push(
                ...(figureList?.results
                    ?.flatMap((item) => item.sources?.results)
                    .filter(isDefined) ?? []),
            );

            if (figureList?.results) {
                organizationsFromEntry.push(
                    ...(figureList?.results
                        ?.flatMap((item) => item.entry.publishers?.results)
                        .filter(isDefined) ?? []),
                );
            }
            const uniqueOrganizations = unique(
                organizationsFromEntry,
                (o) => o.id,
            );
            setOrganizations(uniqueOrganizations);

            const formValues = transform(figureList?.results);
            setValue(formValues);
        },
    });

    useMemo(
        () => {
            const selectedFigureEntry = value.find(
                (v) => v.uuid === selectedFigure,
            );
            setPreview(selectedFigureEntry?.entry?.preview);
            setAttachment(selectedFigureEntry?.entry?.document);
        },
        [
            value,
            selectedFigure,
        ],
    );

    if (eventDataError) {
        return (
            <div className={_cs(styles.loadFailed, className)}>
                Failed to retrieve event data!
            </div>
        );
    }

    return (
        <div className={_cs(styles.eventReview, className)}>
            <PageHeader
                title="Event Review"
            />
            <div>
                <EventForm
                    className={styles.eventForm}
                    id={eventId}
                    readOnly
                />
            </div>

            <div className={styles.content}>
                <div className={styles.figureContent}>
                    <Tabs
                        value="figures"
                        onChange={undefined}
                    >
                        <Tab name="figures">
                            Figures
                        </Tab>
                        <TabPanel
                            className={styles.figure}
                            name="figures"
                        >
                            {value?.length === 0 ? (
                                <div>
                                    No figures yet
                                </div>
                            ) : value?.map((fig, index) => (
                                <FigureInput
                                    key={fig.uuid}
                                    selectedFigure={selectedFigure}
                                    setSelectedFigure={setSelectedFigure}
                                    index={index}
                                    value={fig}
                                    onChange={() => null}
                                    onRemove={() => null}
                                    error={undefined}
                                    disabled={getFiguresLoading}
                                    mode={mode}
                                    optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                                    tagOptions={tagOptions}
                                    setTagOptions={setTagOptions}
                                    violenceContextOptions={violenceContextOptions}
                                    setViolenceContextOptions={setViolenceContextOptions}
                                    events={events}
                                    setEvents={setEvents}
                                    causeOptions={figureOptionsData?.crisisType?.enumValues}
                                    accuracyOptions={figureOptionsData?.accuracyList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    categoryOptions={figureOptionsData?.figureCategoryList?.enumValues}
                                    unitOptions={figureOptionsData?.unitList?.enumValues}
                                    termOptions={figureOptionsData?.figureTermList?.enumValues}
                                    roleOptions={figureOptionsData?.roleList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    displacementOptions={figureOptionsData?.displacementOccurence?.enumValues}
                                    // eslint-disable-next-line max-len
                                    identifierOptions={figureOptionsData?.identifierList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    genderCategoryOptions={figureOptionsData?.disaggregatedGenderList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    quantifierOptions={figureOptionsData?.quantifierList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    dateAccuracyOptions={figureOptionsData?.dateAccuracy?.enumValues}
                                    // eslint-disable-next-line max-len
                                    disasterCategoryOptions={figureOptionsData?.disasterCategoryList}
                                    violenceCategoryOptions={figureOptionsData?.violenceList}
                                    osvSubTypeOptions={figureOptionsData?.osvSubTypeList}
                                    // eslint-disable-next-line max-len
                                    otherSubTypeOptions={figureOptionsData?.otherSubTypeList}
                                    trafficLightShown={trafficLightShown}
                                    organizations={organizations}
                                    setOrganizations={setOrganizations}
                                />
                            ))}
                        </TabPanel>
                    </Tabs>
                </div>
                <div className={styles.aside}>
                    <Preview
                        attachment={attachment}
                        preview={preview}
                    />
                </div>
            </div>
        </div>
    );
}

export default EventReview;
