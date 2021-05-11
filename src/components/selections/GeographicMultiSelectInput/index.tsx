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
import { GetGeographicGroupQuery, GetGeographicGroupQueryVariables } from '#generated/types';

import styles from './styles.css';

const GEOGRAPHIC_GROUP = gql`
    query GetGeographicGroup($search: String, $ordering: String){
        geographicalGroupList(name: $search, ordering: $ordering){
            totalCount
            results {
                id
                name
            }
        }
    }
`;

export type GeographicOption = NonNullable<NonNullable<GetGeographicGroupQuery['geographicalGroupList']>['results']>[number];

const keySelector = (d: GeographicOption) => d.id;
const labelSelector = (d: GeographicOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    GeographicOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
>;

function GeographicMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetGeographicGroupQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'name' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetGeographicGroupQuery>(GEOGRAPHIC_GROUP, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.geographicalGroupList?.results;
    const totalOptionsCount = data?.geographicalGroupList?.totalCount;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.regionSelectInput, className)}
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

export default GeographicMultiSelectInput;
