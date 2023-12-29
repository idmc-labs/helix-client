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
import useOptions from '#hooks/useOptions';
import { GetCountryQuery, GetCountryQueryVariables } from '#generated/types';

import styles from './styles.css';

const COUNTRY = gql`
    query GetCountry(
        $search: String,
        $regions: [String!],
        $events: [ID!],
        $crises: [ID!],
        $ordering: String,
    ) {
        countryList(
            countryName: $search,
            regionByIds: $regions,
            ordering: $ordering,
            events: $events,
            crises: $crises,
        ) {
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

export type CountryOption = NonNullable<NonNullable<GetCountryQuery['countryList']>['results']>[number];

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.idmcShortName;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    CountryOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalCount' | 'options' | 'onOptionsChange'
> & {
    regions?: string[] | null,
    events?: string[] | null;
    crises?: string[] | null;
};

function CountrySelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        regions,
        events,
        crises,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCountryQueryVariables => {
            if (!debouncedSearchText) {
                return {
                    ordering: 'idmc_short_name',
                    regions: regions ?? undefined,
                    events,
                    crises,
                };
            }
            return {
                search: debouncedSearchText,
                regions: regions ?? undefined,
                events,
                crises,
            };
        },
        [debouncedSearchText, regions, events, crises],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetCountryQuery>(COUNTRY, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.countryList?.results;
    const totalOptionsCount = data?.countryList?.totalCount;

    const [options, setOptions] = useOptions('country');

    return (
        <SearchSelectInput
            {...otherProps}
            className={_cs(styles.countrySelectInput, className)}
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

export default CountrySelectInput;
