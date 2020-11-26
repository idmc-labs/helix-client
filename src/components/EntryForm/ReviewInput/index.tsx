import React from 'react';
// import { _cs } from '@togglecorp/fujs';
import {
    MultiSelectInput,
    Button,
    // TabPanel,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import {
    UsersForEntryFormQuery,
    UpdateEntryReviewMutation,
    UpdateEntryReviewMutationVariables,
    EntryReviewerType,
    UserType,
} from '#generated/types';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import Row from '../Row';

const USERS = gql`
    query UsersForEntryForm {
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

type UserFields = NonNullable<NonNullable<UsersForEntryFormQuery['users']>['results']>[number]

const labelSelector = (d: UserFields) => `${d.fullName} (${d.email})`;
const keySelector = (d: UserFields) => d.id;

interface ReviewInputProps<N extends string> {
    name: N;
    disabled?: boolean;
    onChange: (newValue: string[], name: N) => void;
    value?: string[];
    reviewMode?: boolean;
    entryId?: string;
    reviewing?: Array<(
        { __typename?: 'EntryReviewerType' }
        & Pick<EntryReviewerType, 'id' | 'status'>
        & { reviewer: (
            { __typename?: 'UserType' }
            & Pick<UserType, 'id'>
        ) }
    )>
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
    } = props;

    const { notify } = React.useContext(NotificationContext);
    const { user } = React.useContext(DomainContext);
    const { data: userData } = useQuery<UsersForEntryFormQuery>(USERS);
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
            <Row>
                <MultiSelectInput
                    keySelector={keySelector}
                    label="Assign Colleagues for Review"
                    labelSelector={labelSelector}
                    name={name}
                    onChange={onChange}
                    options={userData?.users?.results}
                    value={value}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </Row>
            { reviewStatus && reviewMode && (
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
