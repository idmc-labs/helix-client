import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoEllipse } from 'react-icons/io5';
import { PopupButton } from '@togglecorp/toggle-ui';

import {
    Review_Field_Type as ReviewFieldType,
    Review_Comment_Type as ReviewCommentType,
} from '#generated/types';

import ReviewComments from './ReviewComments';
import styles from './styles.css';

export interface TrafficLightInputProps {
    className?: string;
    name: ReviewFieldType;
    value?: ReviewCommentType | undefined | null;

    eventId?: string;
    figureId?: string;
    geoLocationId?: string;
}

function TrafficLightInput(props: TrafficLightInputProps) {
    const {
        className,
        value,
        name,
        figureId,
        eventId,
        geoLocationId,
    } = props;

    return (
        <PopupButton
            className={_cs(styles.trafficLightInput, className)}
            name={undefined}
            transparent
            popupClassName={styles.popup}
            popupContentClassName={styles.popupContent}
            title={value ?? ''}
            compact
            label={(
                <IoEllipse
                    className={_cs(
                        value === 'GREEN' && styles.good,
                        value === 'RED' && styles.bad,
                    )}
                />
            )}
            arrowHidden
        >
            <ReviewComments
                name={name}
                figureId={figureId}
                eventId={eventId}
                geoLocationId={geoLocationId}
            />
        </PopupButton>
    );
}

export default TrafficLightInput;
