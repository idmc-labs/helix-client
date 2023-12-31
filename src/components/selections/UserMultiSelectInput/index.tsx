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
import useOptions from '#hooks/useOptions';
import { GetUserQuery, GetUserQueryVariables } from '#generated/types';

import styles from './styles.css';

const USER = gql`
    query GetUser(
        $ordering: String,
        $filters: UserFilterDataInputType,
    ) {
        users(
            ordering: $ordering,
            filters: $filters,
        ) {
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
type MultiSelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    UserOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    permissions?: string[] | null;
};

function UserMultiSelectInput<K extends string>(props: MultiSelectInputProps<K>) {
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
                filters: {
                    fullName: debouncedSearchText,
                    permissions,
                },
            } : {
                ordering: 'full_name',
                filters: {
                    permissions,
                },
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
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.userMultiSelectInput, className)}
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

export default UserMultiSelectInput;
