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

import useOptions from '#hooks/useOptions';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GetUserQuery,
    GetUserQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const USER = gql`
    query GetUser($search: String, $ordering: String, $permissions: [String!]) {
        users(fullName: $search, ordering: $ordering, permissions: $permissions) {
            totalCount
            results {
                id
                fullName
                isActive
            }
        }
    }
`;

export type UserOption = NonNullable<NonNullable<GetUserQuery['users']>['results']>[number];

const keySelector = (d: UserOption) => d.id;
const labelSelector = (d: UserOption) => {
    const name = d.fullName ?? '?';
    return !d.isActive
        ? `${name} (Inactive)`
        : name;
};

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    UserOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    // permissions?: `${PermissionAction}_${PermissionEntity}`[];
    permissions?: string[] | null;
};

function UserSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        permissions,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetUserQueryVariables => (
            debouncedSearchText ? {
                search: debouncedSearchText,
                permissions,
            } : {
                ordering: 'fullName',
                permissions,
            }
        ),
        [debouncedSearchText, permissions],
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

    const [options, setOptions] = useOptions('user');

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
            options={options}
            onOptionsChange={setOptions}
        />
    );
}

export default UserSelectInput;
