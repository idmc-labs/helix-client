import React, { useCallback } from 'react';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { Button } from '@togglecorp/toggle-ui';
import { Error } from '@togglecorp/toggle-form';

import {
    UpdateEntryReviewMutation,
    UpdateEntryReviewMutationVariables,
    UpdateEntryReviewerMutation,
    UpdateEntryReviewerMutationVariables,
    Review_Status, // eslint-disable-line camelcase
} from '#generated/types';

import UserItem from '#components/UserItem';
import Row from '#components/Row';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import ReviewersMultiSelectInput, { UserOption } from '#components/selections/ReviewersMultiSelectInput';

import {
    Reviewing,
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

const UPDATE_ENTRY_REVIEWER = gql`
    mutation updateEntryReviewer($entry: EntryUpdateInputType!) {
        updateEntry(data: $entry) {
            result {
                id
                reviewers {
                    results {
                      id
                      fullName
                    }
                }
            }
            errors
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
}

function ReviewSaveInput<N extends string>(props: ReviewInputProps<N>) {
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
    } = props;

    const reviewMode = mode === 'review';

    const {
        notify,
        notifyGQLError,
    } = React.useContext(NotificationContext);
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
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Review status updated successfully',
                        variant: 'success',
                    });
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
    );

    const [
        updateEntryReviewer,
        { loading: updateEntryReviewerLoading },
    ] = useMutation<UpdateEntryReviewerMutation, UpdateEntryReviewerMutationVariables>(
        UPDATE_ENTRY_REVIEWER,
        {
            onCompleted: (response) => {
                const { updateEntry: updateEntryReviewerRes } = response;
                if (!updateEntryReviewerRes) {
                    return;
                }
                const { result, errors } = updateEntryReviewerRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Reviewer updated successfully',
                        variant: 'success',
                    });
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
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

    const handleReviewerChange = useCallback(() => {
        if (entryId) {
            updateEntryReviewer({
                variables: {
                    entry: {
                        id: entryId,
                        reviewers: value,
                    },
                },
            });
        }
    }, [updateEntryReviewer, entryId, value]);

    return (
        <>
            <ReviewersMultiSelectInput
                name={name}
                label="Reviewers"
                onChange={onChange}
                value={value}
                disabled={disabled}
                options={users}
                onOptionsChange={setUsers}
                error={error?.$internal}
                actions={entryPermissions?.change && (
                    <Button
                        name={undefined}
                        disabled={disabled || updateEntryReviewerLoading}
                        onClick={handleReviewerChange}
                        transparent
                    >
                        Save reviewers
                    </Button>
                )}
                readOnly={!entryPermissions?.change}
            />
            <Row singleColumnNoGrow>
                {reviewMode && (
                    <>
                        {hasBeenSignedOff ? (
                            <>
                                {entryPermissions?.sign_off && reviewer?.status === 'SIGNED_OFF' && (
                                    <Button
                                        name={undefined}
                                        onClick={handleUndoReviewClick}
                                    >
                                        Mark as under review
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                {reviewPermissions?.add && (!reviewer || reviewer.status !== 'UNDER_REVIEW') && (
                                    <Button
                                        name={undefined}
                                        onClick={handleUndoReviewClick}
                                    >
                                        Mark as under review
                                    </Button>
                                )}
                                {reviewPermissions?.add && (!reviewer || reviewer.status !== 'REVIEW_COMPLETED') && (
                                    <Button
                                        name={undefined}
                                        onClick={handleCompleteReviewClick}
                                    >
                                        Approve
                                    </Button>
                                )}
                                {entryPermissions?.sign_off && (
                                    <Button
                                        name={undefined}
                                        onClick={handleSignOffClick}
                                    >
                                        Sign off
                                    </Button>
                                )}
                            </>
                        )}
                    </>
                )}
            </Row>
            <div className={styles.reviewStatuses}>
                {reviewing?.map((item) => (
                    <div
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

export default ReviewSaveInput;
