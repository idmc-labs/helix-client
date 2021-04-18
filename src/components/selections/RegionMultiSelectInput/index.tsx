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
import { GetRegionQuery, GetRegionQueryVariables } from '#generated/types';

import styles from './styles.css';

const COUNTRY_REGION = gql`
    query GetRegion($search: String){
        countryRegionList(name: $search){
            results {
                id
                name
            }
        }
    }
`;

export type RegionOption = NonNullable<NonNullable<GetRegionQuery['countryRegionList']>['results']>[number];

const keySelector = (d: RegionOption) => d.id;
const labelSelector = (d: RegionOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    RegionOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function RegionMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetRegionQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetRegionQuery>(COUNTRY_REGION, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.countryRegionList?.results;

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

export default RegionMultiSelectInput;
