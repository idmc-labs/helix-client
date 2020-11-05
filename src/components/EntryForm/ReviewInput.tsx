import React from 'react';
// import { _cs } from '@togglecorp/fujs';
import {
    MultiSelectInput,
    // TabPanel,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';

import { UsersForEntryFormQuery } from '#generated/types';
import styles from './styles.css';

const USERS = gql`
    query UsersForEntryForm {
        users {
            results {
                id
                email
                firstName
                lastName
            }
        }
    }
`;

type UserFields = NonNullable<NonNullable<UsersForEntryFormQuery['users']>['results']>[number]

const labelSelector = (d: UserFields) => `${d.firstName} ${d.lastName} (${d.email})`;
const keySelector = (d: UserFields) => d.id;

interface ReviewInputProps<N extends string> {
    name: N;
    disabled?: boolean;
    onChange: (newValue: string[], name: N) => void;
    value?: string[];
}

function Review<N extends string>(props: ReviewInputProps<N>) {
    const {
        disabled,
        value,
        onChange,
        name,
    } = props;

    const { data } = useQuery<UsersForEntryFormQuery>(USERS);

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
                />
            </div>
        </>
    );
}

export default Review;
