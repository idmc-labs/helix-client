import React, { useRef } from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoAddCircleSharp } from 'react-icons/io5';
import { Button, PopupButton } from '@togglecorp/toggle-ui';

import { ReviewFields } from '#views/Entry/EntryForm/types';
import { Entry_Review_Status as EntryReviewStatus } from '#generated/types';
import CommentItem from '#components/CommentItem';

import styles from './styles.css';

export interface TrafficLightInputProps<N> {
    className?: string;
    name: N;
    onChange?: (newValue: EntryReviewStatus, name: N) => void;
    value: EntryReviewStatus | undefined | null;
    comment: ReviewFields['comment'] | undefined | null;
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
                <IoAddCircleSharp
                    className={_cs(
                        value === 'GREEN' && styles.good,
                        value === 'RED' && styles.bad,
                    )}
                />
            )}
            arrowHidden
        >
            <div className={styles.buttons}>
                <Button
                    className={styles.good}
                    name="GREEN"
                    onClick={handleClick}
                    transparent
                    compact
                    disabled={disabled || value === 'GREEN'}
                >
                    Good
                </Button>
                <Button
                    name="GREY"
                    onClick={handleClick}
                    transparent
                    compact
                    disabled={disabled || value === 'GREY'}
                >
                    Not reviewed
                </Button>
                <Button
                    className={styles.bad}
                    name="RED"
                    onClick={handleClick}
                    transparent
                    compact
                    disabled={disabled || value === 'RED'}
                >
                    To be corrected
                </Button>
            </div>
            {comment && (
                <CommentItem
                    comment={comment}
                    deleteDisabled
                    editDisabled
                />
            )}
        </PopupButton>
    );
}

export default TrafficLightInput;
