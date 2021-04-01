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
    query GetGeographicGroup($search: String){
        geographicalGroupList(name_Icontains: $search){
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
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function GeographicMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetGeographicGroupQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetGeographicGroupQuery>(GEOGRAPHIC_GROUP, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.geographicalGroupList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.regionSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default GeographicMultiSelectInput;
