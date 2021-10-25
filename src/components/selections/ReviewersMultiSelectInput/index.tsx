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
    query GetUsers($search: String, $ordering: String) {
        reviewerUserList(fullName: $search, ordering: $ordering, isActive: true) {
            totalCount
            results {
                id
                fullName
            }
        }
    }
`;

export type UserOption = NonNullable<NonNullable<GetUsersQuery['reviewerUserList']>['results']>[number];

const keySelector = (d: UserOption) => d.id;
const labelSelector = (d: UserOption) => d.fullName;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    UserOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalCount'
>;

function ReviewersMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetUsersQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'fullName' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetUsersQuery>(USERS, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.reviewerUserList?.results;
    const totalOptionsCount = data?.reviewerUserList?.totalCount;

    return (
        <SearchMultiSelectInput
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

export default ReviewersMultiSelectInput;
