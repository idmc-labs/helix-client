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

import { UsersForEntryFormQuery } from '#generated/types';
import styles from './styles.css';

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
}

function Review<N extends string>(props: ReviewInputProps<N>) {
    const {
        disabled,
        value,
        onChange,
        name,
        reviewMode,
        entryId,
    } = props;

    const { data } = useQuery<UsersForEntryFormQuery>(USERS);
    const [
        updateEntryReview,
    ] = useMutation(
        UPDATE_ENTRY_REVIEW,
        {
            onComplete: (response) => {
                console.info(response);
            },
        },
    );

    return (
        <>
            <div className={styles.row}>
                <MultiSelectInput
                    className={styles.reviewAssigneeInput}
                    keySelector={keySelector}
                    label="Assign Colleagues for Review"
                    labelSelector={labelSelector}
                    name={name}
                    onChange={onChange}
                    options={data?.users?.results}
                    value={value}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </div>
            <div>
                <Button
                    name={undefined}
                    onClick={() => {
                        updateEntryReview({
                            variables: {
                                entryReview: {
                                    entry: entryId,
                                    status: 'REVIEW_COMPLETED',
                                },
                            },
                        });
                    }}
                >
                    Complete review
                </Button>
            </div>
        </>
    );
}

export default Review;
