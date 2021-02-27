import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
} from '@togglecorp/toggle-ui';

import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetUsersQuery, GetUsersQueryVariables } from '#generated/types';

import styles from './styles.css';

const USERS = gql`
    query GetUsers($search: String){
        reviewerUserList(fullName: $search) {
            results {
                id
                email
                fullName
            }
        }
    }
`;

export type UserOption = NonNullable<NonNullable<GetUsersQuery['reviewerUserList']>['results']>[number];

const keySelector = (d: UserOption) => d.id;
// FIXME: fullName should be a required field on server
const labelSelector = (d: UserOption) => d.fullName ?? d.email;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    UserOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function ReviewersMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetUsersQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetUsersQuery>(USERS, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.reviewerUserList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.userSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default ReviewersMultiSelectInput;
