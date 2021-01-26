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
    query GetCountries($search: String, $regions: [String]){
        countryList(countryName: $search, regions: $regions){
            results {
                id
                name
                boundingBox
                iso2
            }
        }
    }
`;

export type CountryOption = NonNullable<NonNullable<GetCountriesQuery['countryList']>['results']>[number];

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    CountryOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
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

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCountriesQueryVariables | undefined => {
            if (!debouncedSearchText) {
                return undefined;
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
        data,
    } = useQuery<GetCountriesQuery>(COUNTRIES, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.countryList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.countrySelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default CountryMultiSelectInput;
