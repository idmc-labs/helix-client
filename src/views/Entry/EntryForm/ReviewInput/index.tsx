import React from 'react';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { Button } from '@togglecorp/toggle-ui';
import { Error } from '@togglecorp/toggle-form';

import {
    UpdateEntryReviewMutation,
    UpdateEntryReviewMutationVariables,
    Review_Status, // eslint-disable-line camelcase
} from '#generated/types';

import UserItem from '#components/UserItem';
import Row from '#components/Row';
import TrafficLightInput from '#components/TrafficLightInput';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
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

const UPDATE_ENTRY_REVIEW = gql`
    mutation UpdateEntryReview($entryReview: EntryReviewStatusInputType!) {
        updateEntryReview (data: $entryReview) {
            ok
            errors
            result {
                id
                status
                reviewer {
                    id
                    fullName
                }
                entry {
                    id
                    reviewing {
                        id
                        status
                        createdAt
                        reviewer {
                            id
                            fullName
                        }
                    }
                }
            }
        }
    }
`;

interface ReviewInputProps<N extends string> {
    name: N;
    disabled?: boolean;
    onChange: (newValue: string[], name: N) => void;
    value?: string[];
    mode: 'view' | 'review' | 'edit';
    entryId?: string;
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
        entryId,
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

    const { notify } = React.useContext(NotificationContext);
    const { user } = React.useContext(DomainContext);

    const entryPermissions = user?.permissions?.entry;
    const reviewPermissions = user?.permissions?.review;

    const [
        updateEntryReview,
    ] = useMutation<UpdateEntryReviewMutation, UpdateEntryReviewMutationVariables>(
        UPDATE_ENTRY_REVIEW,
        {
            onCompleted: (response) => {
                const { updateEntryReview: updateEntryReviewRes } = response;
                if (!updateEntryReviewRes) {
                    return;
                }
                const { result, errors } = updateEntryReviewRes;
                if (result) {
                    notify({ children: 'Review status updated successfully' });
                }
                if (errors) {
                    notify({ children: 'Failed to update review status' });
                }
            },
            onError: (err) => {
                notify({ children: err.message });
            },
        },
    );

    const reviewer = React.useMemo(() => (
        reviewing
            ?.map((d) => ({
                id: d.reviewer.id,
                status: d.status,
            }))
            .find((d) => d.id === user?.id)
    ), [reviewing, user]);

    const hasBeenSignedOff = !!reviewing?.find((d) => d.status === 'SIGNED_OFF');

    const handleCompleteReviewClick = React.useCallback(() => {
        if (entryId) {
            updateEntryReview({
                variables: {
                    entryReview: {
                        entry: entryId,
                        status: 'REVIEW_COMPLETED',
                    },
                },
            });
        }
    }, [updateEntryReview, entryId]);

    const handleUndoReviewClick = React.useCallback(() => {
        if (entryId) {
            updateEntryReview({
                variables: {
                    entryReview: {
                        entry: entryId,
                        status: 'UNDER_REVIEW',
                    },
                },
            });
        }
    }, [updateEntryReview, entryId]);

    const handleSignOffClick = React.useCallback(() => {
        if (entryId) {
            updateEntryReview({
                variables: {
                    entryReview: {
                        entry: entryId,
                        status: 'SIGNED_OFF',
                    },
                },
            });
        }
    }, [updateEntryReview, entryId]);

    return (
        <>
            <Row>
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
            </Row>
            {reviewMode && (
                <>
                    {hasBeenSignedOff ? (
                        <>
                            {entryPermissions?.sign_off && reviewer?.status === 'SIGNED_OFF' && (
                                <Row singleColumnNoGrow>
                                    <Button
                                        name={undefined}
                                        onClick={handleUndoReviewClick}
                                    >
                                        Mark as under review
                                    </Button>
                                </Row>
                            )}
                        </>
                    ) : (
                        <>
                            {reviewPermissions?.add && (!reviewer || reviewer.status !== 'UNDER_REVIEW') && (
                                <Row singleColumnNoGrow>
                                    <Button
                                        name={undefined}
                                        onClick={handleUndoReviewClick}
                                    >
                                        Mark as under review
                                    </Button>
                                </Row>
                            )}
                            {reviewPermissions?.add && (!reviewer || reviewer.status !== 'REVIEW_COMPLETED') && (
                                <Row singleColumnNoGrow>
                                    <Button
                                        name={undefined}
                                        onClick={handleCompleteReviewClick}
                                    >
                                        Approve
                                    </Button>
                                </Row>
                            )}
                            {entryPermissions?.sign_off && (
                                <Row singleColumnNoGrow>
                                    <Button
                                        name={undefined}
                                        onClick={handleSignOffClick}
                                    >
                                        Sign off
                                    </Button>
                                </Row>
                            )}
                        </>
                    )}
                </>
            )}
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
