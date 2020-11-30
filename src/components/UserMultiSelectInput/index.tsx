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

// TODO: Search user by emailContains or nameContains
const USERS = gql`
    query GetUsers($search: String){
        users(email: $search) {
            results {
                id
                email
                fullName
            }
        }
    }
`;

export type UserOption = NonNullable<NonNullable<GetUsersQuery['users']>['results']>[number];

const keySelector = (d: UserOption) => d.id;
const labelSelector = (d: UserOption) => `${d.fullName} (${d.email})`;

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

function UserMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetUsersQueryVariables => ({ search: debouncedSearchText }),
        [debouncedSearchText],
    );

    const {
        loading,
        data,
    } = useQuery<GetUsersQuery>(USERS, {
        skip: !searchText,
        variables: searchVariable,
    });

    const searchOptions = data?.users?.results;

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

export default UserMultiSelectInput;