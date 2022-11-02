import React, { useRef } from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoEllipse } from 'react-icons/io5';
import { Button, PopupButton } from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import CommentItem, { Comment } from '#components/CommentItem';

import styles from './styles.css';

type EntryReviewStatus = 'GREEN' | 'GREY' | 'RED';

export interface TrafficLightInputProps<N> {
    className?: string;
    name: N;
    onChange?: (newValue: EntryReviewStatus, name: N) => void;
    value?: EntryReviewStatus | undefined | null;
    comment?: Comment;
    disabled?: boolean;
}

function TrafficLightInput<N extends string>(props: TrafficLightInputProps<N>) {
    const {
        className,
        value,
        name,
        comment,
        onChange,
        disabled,
    } = props;

    const popupElementRef = useRef<{
        setPopupVisibility: React.Dispatch<React.SetStateAction<boolean>>;
    }>(null);

    const handleClick = React.useCallback((newValue) => {
        if (onChange) {
            onChange(newValue, name);

            setTimeout(() => {
                popupElementRef.current?.setPopupVisibility(false);
            }, 0);
        }
    }, [name, onChange]);

    return (
        <PopupButton
            className={_cs(styles.trafficLightInput, className)}
            componentRef={popupElementRef}
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
            {!disabled && (
                <div className={styles.buttons}>
                    <Button
                        name="GREEN"
                        onClick={handleClick}
                        transparent
                        compact
                        disabled={value === 'GREEN'}
                    >
                        Good
                    </Button>
                    <Button
                        name="GREY"
                        onClick={handleClick}
                        transparent
                        compact
                        disabled={value === 'GREY'}
                    >
                        Not reviewed
                    </Button>
                    <Button
                        name="RED"
                        onClick={handleClick}
                        transparent
                        compact
                        disabled={value === 'RED'}
                    >
                        To be corrected
                    </Button>
                </div>
            )}
            {comment ? (
                <CommentItem
                    comment={comment}
                    deleteDisabled
                    editDisabled
                />
            ) : (
                <Message
                    message="No comment found."
                />
            )}
        </PopupButton>
    );
}

export default TrafficLightInput;
