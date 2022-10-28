import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@togglecorp/toggle-ui';

import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetUserQuery, GetUserQueryVariables, User_Role as UserRole } from '#generated/types';

import styles from './styles.css';

const USER = gql`
    query GetUser($search: String, $ordering: String, $roles: [String!]) {
        users(fullName: $search, ordering: $ordering, isActive: true, roleIn: $roles) {
            totalCount
            results {
                id
                fullName
            }
        }
    }
`;

export type UserOption = NonNullable<NonNullable<GetUserQuery['users']>['results']>[number];

const keySelector = (d: UserOption) => d.id;
const labelSelector = (d: UserOption) => d.fullName ?? '?';

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    UserOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
> & {
    roles?: UserRole[];
};

function UserSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        roles,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetUserQueryVariables => (
            debouncedSearchText ? {
                search: debouncedSearchText,
                roles,
            } : {
                ordering: 'fullName',
                roles,
            }
        ),
        [debouncedSearchText, roles],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetUserQuery>(USER, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.users?.results;
    const totalOptionsCount = data?.users?.totalCount;

    return (
        <SearchSelectInput
            {...otherProps}
            className={_cs(styles.userSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={setOpened}
            searchOptions={searchOptions}
            optionsPending={loading}
            totalOptionsCount={totalOptionsCount ?? undefined}
        />
    );
}

export default UserSelectInput;
