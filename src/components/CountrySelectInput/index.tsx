import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    SearchSelectInput,
    SearchSelectInputProps,
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
> = SearchSelectInputProps<
    string,
    K,
    CountryOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function CountrySelectInput<K extends string>(props: SelectInputProps<K>) {
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
        skip: !searchText,
        variables: searchVariable,
    });

    const searchOptions = data?.countryList?.results;

    return (
        <SearchSelectInput
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

export default CountrySelectInput;
