import React, {
    useMemo,
    useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { isDefined, _cs } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';
import { removeNull } from '@togglecorp/toggle-form';

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
    SourcePreview,
} from '#views/Entry/EntryForm/types';
import FigureAndPreview from './FigureAndPreview';

import styles from './styles.css';

interface Props {
    className: string;
}

function EventReview(props: Props) {
    const { className } = props;
    const { eventId } = useParams<{ eventId: string }>();
    const [selectedFigure, setSelectedFigure] = useState<string | undefined>();
    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<SourcePreview | undefined>(undefined);
    const [
        events,
        setEvents,
    ] = useState<EventListOption[] | null | undefined>([]);

    const figureId = useMemo(
        () => {
            const params = new URLSearchParams(document.location.search);
            return params.get('id');
        },
        [],
    );

    // FIXME: type error
    const variables = useMemo(
        (): FigureListQueryVariables | undefined => (
            eventId ? { event: eventId } : undefined
        ),
        [eventId],
    );

    const {
        loading: getFiguresLoading,
        data: figureListResponse,
    } = useQuery<FigureListQuery, FigureListQueryVariables>(FIGURE_LIST, {
        skip: !eventId,
        variables,
        onCompleted: (response) => {
            const { figureList } = removeNull(response);
            setEvents(figureList?.results?.map((item) => item.event).filter(isDefined));

            const mainFigure = figureList?.results?.find((element) => element.id === figureId);
            setSelectedFigure(mainFigure?.uuid);

            if (mainFigure?.entry.preview) {
                setPreview(mainFigure.entry.preview);
            }
            if (mainFigure?.entry.document) {
                setAttachment(mainFigure.entry.document);
            }
        },
    });

    return (
        <div className={_cs(styles.eventReview, className)}>
            <PageHeader
                title="Event Review"
            />
            <div>
                <EventForm
                    className={styles.eventForm}
                    id={eventId}
                />
            </div>
            <FigureAndPreview
                loading={getFiguresLoading}
                figures={figureListResponse?.figureList?.results}
                setSelectedFigure={setSelectedFigure}
                selectedFigure={selectedFigure}
                events={events}
                setEvents={setEvents}
                attachment={attachment}
                preview={preview}
            />
        </div>
    );
}

export default EventReview;
