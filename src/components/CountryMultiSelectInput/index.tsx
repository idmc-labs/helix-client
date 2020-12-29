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
import { GetCountryQuery, GetCountryQueryVariables } from '#generated/types';

import styles from './styles.css';

const COUNTRY = gql`
    query GetCountry($search: String){
        countryList(countryName: $search){
            results {
                id
                name
                boundingBox
                iso2
            }
        }
    }
`;

export type CountryOption = NonNullable<NonNullable<GetCountryQuery['countryList']>['results']>[number];

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
>;

function CountryMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCountryQueryVariables => ({ search: debouncedSearchText }),
        [debouncedSearchText],
    );

    const {
        loading,
        data,
    } = useQuery<GetCountryQuery>(COUNTRY, {
        skip: !debouncedSearchText,
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
