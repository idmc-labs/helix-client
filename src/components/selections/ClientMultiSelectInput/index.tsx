import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
} from '@togglecorp/toggle-ui';

import useOptions from '#hooks/useOptions';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    ApiClientListQuery,
    ApiClientListQueryVariables,
} from '#generated/types';

const GET_CLIENT_CODE_OPTIONS = gql`
    query ApiClientList($search: String, $ordering: String) {
        clientList (name: $search, ordering: $ordering) {
            totalCount
            results {
                id
                code
                name
            }
        }
    }
`;

export type ClientCodeOption = NonNullable<NonNullable<ApiClientListQuery['clientList']>['results']>[number];

const keySelector = (d: ClientCodeOption) => d.code;
const labelSelector = (d: ClientCodeOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    ClientCodeOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
>;

function ClientMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): ApiClientListQueryVariables => (
            debouncedSearchText
                ? { search: debouncedSearchText }
                : { ordering: '-created_at' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<ApiClientListQuery>(GET_CLIENT_CODE_OPTIONS, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.clientList?.results;
    const totalOptionsCount = data?.clientList?.totalCount;

    const [options, setOptions] = useOptions('client');

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={className}
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

export default ClientMultiSelectInput;
