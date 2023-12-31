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
import { GetRegionQuery, GetRegionQueryVariables } from '#generated/types';

import styles from './styles.css';

const COUNTRY_REGION = gql`
    query GetRegion(
        $search: String,
        $ordering: String,
    ) {
        countryRegionList(
            ordering: $ordering,
            filters: { name: $search },
        ) {
            totalCount
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
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange' | 'options' | 'onOptionsChange' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
>;

function RegionMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetRegionQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'name' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetRegionQuery>(COUNTRY_REGION, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.countryRegionList?.results;
    const totalOptionsCount = data?.countryRegionList?.totalCount;

    const [options, setOptions] = useOptions('region');

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
            options={options}
            onOptionsChange={setOptions}
        />
    );
}

export default RegionMultiSelectInput;
