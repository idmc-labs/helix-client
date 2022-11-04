import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';

import { FIGURE_LIST } from '#views/Entry/EntryForm/queries';
import EventForm from '#components/forms/EventForm';
import PageHeader from '#components/PageHeader';
import {
    FigureListQuery,
    FigureListQueryVariables,
} from '#generated/types';
import FigureAndPreview from './FigureandPreview';

import styles from './styles.css';

interface Props {
    className: string;
}

function EventReview(props: Props) {
    const { className } = props;
    const { eventId } = useParams<{ eventId: string }>();

    // TODO:
    const variables = useMemo(
        (): FigureListQueryVariables | undefined => (
            eventId ? { event: eventId } : undefined
        ),
        [eventId],
    );

    const {
        data: figureListResponse,
        loading: loadingFigureResponse,
    } = useQuery<FigureListQuery, FigureListQueryVariables>(FIGURE_LIST, {
        skip: !eventId,
        variables,
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
            <FigureAndPreview />
        </div>
    );
}

export default EventReview;
