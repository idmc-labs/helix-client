import React, { useCallback, useState } from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoEllipse } from 'react-icons/io5';
import { PopupButton, Modal } from '@togglecorp/toggle-ui';

import {
    Review_Field_Type as ReviewFieldType,
    Review_Comment_Type as ReviewCommentType,
} from '#generated/types';
import useBasicToggle from '#hooks/useBasicToggle';

import ReviewComments from './ReviewComments';
import CommentForm from './ReviewComments/CommentForm';
import styles from './styles.css';

export interface TrafficLightInputProps {
    className?: string;
    name: ReviewFieldType;
    value?: ReviewCommentType | undefined | null;

    assigneeMode?: boolean;

    eventId?: string;
    figureId?: string;
    geoLocationId?: string;

    reviewDisabled?: boolean;
    defaultShownField: string | null;
}

function TrafficLightInput(props: TrafficLightInputProps) {
    const {
        className,
        value,
        name,
        figureId,
        eventId,
        geoLocationId,

        assigneeMode,
        reviewDisabled,
        defaultShownField,
    } = props;

    const [
        shouldShowCommentModal,
        showCommentModal,
        hideCommentModal,
    ] = useBasicToggle();

    const [commentIdOnEdit, setCommentIdOnEdit] = useState<string | undefined>();

    const handleShowCommentModal = useCallback(
        (id: string) => {
            setCommentIdOnEdit(id);
            showCommentModal();
        },
        [setCommentIdOnEdit, showCommentModal],
    );

    const handleHideCommentModal = useCallback(() => {
        setCommentIdOnEdit(undefined);
        hideCommentModal();
    }, [setCommentIdOnEdit, hideCommentModal]);

    return (
        <>
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
                persistent={shouldShowCommentModal}
                defaultShown={name === defaultShownField}
            >
                <ReviewComments
                    name={name}
                    figureId={figureId}
                    eventId={eventId}
                    geoLocationId={geoLocationId}
                    onReviewEdit={handleShowCommentModal}
                    reviewDisabled={reviewDisabled}
                    assigneeMode={assigneeMode}
                />
            </PopupButton>
            {shouldShowCommentModal && (
                <Modal
                    heading="Edit Comment"
                    onClose={handleHideCommentModal}
                    size="medium"
                    freeHeight
                >
                    <CommentForm
                        id={commentIdOnEdit}
                        name={name}
                        eventId={eventId}
                        figureId={figureId}
                        geoLocationId={geoLocationId}
                        onCommentFormCancel={handleHideCommentModal}
                        cancelable
                    />
                </Modal>
            )}
        </>
    );
}

export default TrafficLightInput;
