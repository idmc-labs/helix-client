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
import { GetCountriesQuery, GetCountriesQueryVariables } from '#generated/types';

import styles from './styles.css';

const COUNTRIES = gql`
    query GetCountries($search: String, $regions: [String!], $ordering: String){
        countryList(countryName: $search, regionByIds: $regions, ordering: $ordering){
            totalCount
            results {
                id
                idmcShortName
                boundingBox
                iso2
            }
        }
    }
`;

export type CountryOption = NonNullable<NonNullable<GetCountriesQuery['countryList']>['results']>[number];

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.idmcShortName;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    CountryOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
> & {
    regions?: string[],
};

function CountryMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        regions,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCountriesQueryVariables => {
            if (!debouncedSearchText) {
                return { ordering: 'idmcShortName' };
            }
            return {
                search: debouncedSearchText,
                regions: regions ?? undefined,
            };
        },
        [debouncedSearchText, regions],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetCountriesQuery>(COUNTRIES, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.countryList?.results;
    const totalOptionsCount = data?.countryList?.totalCount;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.countrySelectInput, className)}
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

export default CountryMultiSelectInput;
