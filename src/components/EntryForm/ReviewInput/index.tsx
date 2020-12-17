import React from 'react';
import { Button } from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
} from '@apollo/client';

import {
    UpdateEntryReviewMutation,
    UpdateEntryReviewMutationVariables,
    Review_Status, // eslint-disable-line camelcase
} from '#generated/types';
import { Reviewing } from '../types';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import UserMultiSelectInput, { UserOption } from '#components/UserMultiSelectInput';

import Row from '../Row';
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
            errors {
                arrayErrors {
                    key
                    messages
                    objectErrors {
                        field
                        messages
                    }
                }
                field
                messages
                objectErrors {
                    field
                    messages
                }
            }
            result {
                id
                status
                reviewer {
                    id
                    fullName
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
    reviewMode?: boolean;
    entryId?: string;
    reviewing?: Reviewing;
    users: UserOption[] | undefined | null;
    setUsers: React.Dispatch<React.SetStateAction<UserOption[] | null | undefined>>;
}

function Review<N extends string>(props: ReviewInputProps<N>) {
    const {
        disabled,
        value,
        onChange,
        name,
        reviewMode,
        entryId,
        reviewing,
        users,
        setUsers,
    } = props;

    const { notify } = React.useContext(NotificationContext);
    const { user } = React.useContext(DomainContext);

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

    const reviewStatus = React.useMemo(() => (
        reviewing?.map((d) => ({
            reviewer: d.reviewer.id,
            status: d.status,
        })).find((d) => d.reviewer === user?.id)
    ), [reviewing, user]);

    const nextStatus = reviewStatus?.status === 'REVIEW_COMPLETED'
        ? 'UNDER_REVIEW'
        : 'REVIEW_COMPLETED';

    const handleCompleteReviewClick = React.useCallback(() => {
        if (entryId) {
            updateEntryReview({
                variables: {
                    entryReview: {
                        entry: entryId,
                        status: nextStatus,
                    },
                },
            });
        }
    }, [updateEntryReview, entryId, nextStatus]);

    return (
        <>
            <Row>
                <UserMultiSelectInput
                    name={name}
                    label="Assign Colleagues for Review"
                    onChange={onChange}
                    value={value}
                    disabled={disabled}
                    readOnly={reviewMode}
                    options={users}
                    onOptionsChange={setUsers}
                />
            </Row>
            {reviewStatus && reviewMode && (
                <Row mode="oneColumnNoGrow">
                    <Button
                        name={undefined}
                        onClick={handleCompleteReviewClick}
                    >
                        {nextStatus === 'REVIEW_COMPLETED' ? 'Complete review' : 'Redo review'}
                    </Button>
                </Row>
            )}
            <div className={styles.reviewStatuses}>
                {reviewing?.map((item) => (
                    <div
                        className={styles.reviewStatus}
                        key={item.id}
                    >
                        <div className={styles.status}>
                            {/* FIXME: the item.status shouldn't be null or undefined */}
                            {item.status ? statusMap[item.status] : 'Unknown'}
                        </div>
                        <div>
                            {item.reviewer.fullName}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

export default Review;
