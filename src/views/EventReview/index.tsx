import React, {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { isDefined, unique, _cs } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';
import {
    createSubmitHandler,
    PartialForm,
    removeNull,
    useForm,
} from '@togglecorp/toggle-form';

import { FIGURE_LIST } from '#views/Entry/EntryForm/queries';
import EventForm from '#components/forms/EventForm';
import PageHeader from '#components/PageHeader';
import { EventListOption } from '#components/selections/EventListSelectInput';
import {
    FigureListQuery,
    FigureListQueryVariables,
} from '#generated/types';
import {
    Attachment,
    FormValues,
    SourcePreview,
} from '#views/Entry/EntryForm/types';
import { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import { ViolenceContextOption } from '#components/selections/ViolenceContextMultiSelectInput';
import { OrganizationOption } from '#components/selections/OrganizationSelectInput';
import { initialFormValues, schema } from '#views/Entry/EntryForm/schema';
import FigureAndPreview from './FigureAndPreview';

import styles from './styles.css';

type PartialFormValues = PartialForm<FormValues>;
interface Props {
    className: string;
}

function EventReview(props: Props) {
    const { className } = props;
    const eventFormRef = useRef<HTMLFormElement>(null);
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

    const {
        value,
        onValueSet,
        onErrorSet,
        validate,
    } = useForm(initialFormValues, schema);

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

            const formValues: PartialFormValues = removeNull({
                figures: figureList?.results?.map((figure) => ({
                    ...figure,
                    event: figure.event?.id,
                    country: figure.country?.id,
                    geoLocations: figure.geoLocations?.results,
                    category: figure.category,
                    term: figure.term,
                    tags: figure.tags?.map((tag) => tag.id),
                    sources: figure.sources?.results?.map((item) => item.id),
                    disaggregationAge: figure.disaggregationAge?.results?.map((item) => ({
                        ...item,
                    })),

                    figureCause: figure.figureCause,

                    disasterSubType: figure.disasterSubType?.id,
                    violenceSubType: figure.violenceSubType?.id,
                    osvSubType: figure.osvSubType?.id,
                    otherSubType: figure.otherSubType?.id,
                    contextOfViolence: figure.contextOfViolence?.map((c) => c.id),
                })),
            });

            onValueSet(formValues);

            if (mainFigure?.entry.preview) {
                setPreview(mainFigure.entry.preview);
            }
            if (mainFigure?.entry.document) {
                setAttachment(mainFigure.entry.document);
            }
        },
    });

    // TODO:
    const handleSubmit = useCallback(() => {
        console.log('handle submit');
    }, []);

    if (eventDataError) {
        return (
            <div className={_cs(styles.loadFailed, className)}>
                Failed to retrieve event data!
            </div>
        );
    }

    return (
        <form
            className={_cs(className, styles.event)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            ref={eventFormRef}
        >
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
                <FigureAndPreview
                    loading={getFiguresLoading}
                    figures={value.figures}
                    setSelectedFigure={setSelectedFigure}
                    selectedFigure={selectedFigure}
                    events={events}
                    setEvents={setEvents}
                    attachment={attachment}
                    preview={preview}
                    tagOptions={tagOptions}
                    setTagOptions={setTagOptions}
                    violenceContextOptions={violenceContextOptions}
                    setViolenceContextOptions={setViolenceContextOptions}
                    organizations={organizations}
                    setOrganizations={setOrganizations}
                />
            </div>
        </form>
    );
}

export default EventReview;
