import React, { useState } from 'react';
// import { _cs } from '@togglecorp/fujs';
import {
    Button,
    // TabPanel,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

import {
    UsersForEntryFormQuery,
    UpdateEntryReviewMutation,
    UpdateEntryReviewMutationVariables,
} from '#generated/types';
import { Reviewing } from '../types';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import UserMultiSelectInput, { UserOption } from '#components/UserMultiSelectInput';
import Loading from '#components/Loading';

import Row from '../Row';

const USERS = gql`
    query USersForEntryForm {
        users {
            results {
                id
                email
                fullName
            }
        }
    }
`;

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
        users,
        setUsers,
    ] = useState<UserOption[] | undefined | null>();

    const { loading: userDataLoading } = useQuery<UsersForEntryFormQuery>(USERS, {
        onCompleted: (response) => {
            const usersList = response.users?.results;
            if (!usersList) {
                return;
            }
            setUsers(usersList);
        },
    });

    const [
        updateEntryReview,
    ] = useMutation<UpdateEntryReviewMutation, UpdateEntryReviewMutationVariables>(
        UPDATE_ENTRY_REVIEW,
        {
            onCompleted: (response) => {
                if (response?.updateEntryReview?.ok) {
                    notify({ children: 'Review status updated successfully' });
                } else {
                    notify({ children: 'Failed to update review status' });
                }
            },
            // TODO: update cache
        },
    );

    const reviewStatus = React.useMemo(() => (
        reviewing?.map((d) => ({
            reviewer: d.reviewer?.id,
            status: d.status,
        })).find((d) => d.reviewer === user?.id)
    ), [reviewing, user]);

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

    return (
        <>
            {userDataLoading && <Loading />}
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
                        disabled={reviewStatus.status === 'REVIEW_COMPLETED'}
                    >
                        Complete review
                    </Button>
                </Row>
            )}
        </>
    );
}

export default Review;
