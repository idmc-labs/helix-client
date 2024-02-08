import React, {
    useCallback,
    useState,
    useEffect,
    useRef,
    Dispatch,
    SetStateAction,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoEllipse } from 'react-icons/io5';
import { PopupButton, Modal } from '@togglecorp/toggle-ui';

import {
    FigureMetadata,
} from '#components/forms/EntryForm/types';
import {
    Review_Field_Type as ReviewFieldType,
    Review_Comment_Type as ReviewCommentType,
} from '#generated/types';
import useBasicToggle from '#hooks/useBasicToggle';
import { EventListOption } from '#components/selections/EventListSelectInput';

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

    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    setFigureMetadata: (
        value: FigureMetadata
            | ((oldValue: FigureMetadata | undefined) => FigureMetadata)
            | undefined,
        key: string,
    ) => void;

    reviewDisabled?: boolean;
    defaultShown?: boolean;
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
        defaultShown,

        setEvents,
        setFigureMetadata,
    } = props;

    const elementRef = useRef<HTMLButtonElement>(null);

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

    const jumpToElement = defaultShown;

    useEffect(() => {
        if (jumpToElement) {
            elementRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [jumpToElement]);

    return (
        <>
            <PopupButton
                elementRef={elementRef}
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
                defaultShown={defaultShown}
            >
                <ReviewComments
                    name={name}
                    figureId={figureId}
                    eventId={eventId}
                    geoLocationId={geoLocationId}
                    onReviewEdit={handleShowCommentModal}
                    reviewDisabled={reviewDisabled}
                    assigneeMode={assigneeMode}
                    setEvents={setEvents}
                    setFigureMetadata={setFigureMetadata}
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
                        setEvents={setEvents}
                        setFigureMetadata={setFigureMetadata}
                    />
                </Modal>
            )}
        </>
    );
}

export default TrafficLightInput;
