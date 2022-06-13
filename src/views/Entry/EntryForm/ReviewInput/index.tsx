import React from 'react';
import { Error } from '@togglecorp/toggle-form';

import {
    Review_Status, // eslint-disable-line camelcase
} from '#generated/types';

import UserItem from '#components/UserItem';
import TrafficLightInput from '#components/TrafficLightInput';

import ReviewersMultiSelectInput, { UserOption } from '#components/selections/ReviewersMultiSelectInput';

import {
    Reviewing,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';
import styles from './styles.css';

const statusMap: {
    [key in Review_Status]: string; // eslint-disable-line camelcase
} = {
    UNDER_REVIEW: 'Under review',
    REVIEW_COMPLETED: 'Review completed',
    SIGNED_OFF: 'Signed off',
    TO_BE_REVIEWED: 'To be reviewed',
};

interface ReviewInputProps<N extends string> {
    name: N;
    disabled?: boolean;
    onChange: (newValue: string[], name: N) => void;
    value?: string[];
    mode: 'view' | 'review' | 'edit';
    reviewing?: Reviewing;
    users: UserOption[] | undefined | null;
    setUsers: React.Dispatch<React.SetStateAction<UserOption[] | null | undefined>>;
    error: Error<string[]> | undefined;
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    trafficLightShown: boolean;
}

function Review<N extends string>(props: ReviewInputProps<N>) {
    const {
        disabled,
        value,
        onChange,
        name,
        mode,
        reviewing,
        users,
        setUsers,
        error,
        review,
        onReviewChange,
        trafficLightShown,
    } = props;

    const editMode = mode === 'edit';
    const reviewMode = mode === 'review';

    return (
        <>
            <ReviewersMultiSelectInput
                name={name}
                label="Reviewers"
                onChange={onChange}
                value={value}
                disabled={disabled}
                readOnly={!editMode}
                options={users}
                onOptionsChange={setUsers}
                error={error?.$internal}
                icons={trafficLightShown && review && (
                    <TrafficLightInput
                        disabled={!reviewMode}
                        name="reviewers"
                        value={review.reviewers?.value}
                        comment={review.reviewers?.comment}
                        onChange={onReviewChange}
                    />
                )}
            />
            <div className={styles.reviewStatuses}>
                {reviewing?.map((item) => (
                    <div
                        className={styles.reviewStatus}
                        key={item.id}
                    >
                        <h4>
                            {/* FIXME: the item.status shouldn't be null or undefined */}
                            {item.status ? statusMap[item.status] : 'Unknown'}
                        </h4>
                        <UserItem
                            name={item.reviewer.fullName}
                            date={item.createdAt}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}

export default Review;
