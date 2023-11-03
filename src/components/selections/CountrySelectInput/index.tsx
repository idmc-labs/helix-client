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
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalCount'
> & {
    defaultRegions?: string[],
    defaultEvents?: string[];
    defaultCrises?: string[];
};

function CountrySelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        defaultRegions,
        defaultEvents,
        defaultCrises,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCountryQueryVariables => {
            if (!debouncedSearchText) {
                return {
                    ordering: 'idmcShortName',
                    regions: defaultRegions ?? undefined,
                    events: defaultEvents,
                    crises: defaultCrises,
                };
            }
            return {
                search: debouncedSearchText,
                regions: defaultRegions ?? undefined,
                events: defaultEvents,
                crises: defaultCrises,
            };
        },
        [debouncedSearchText, defaultRegions, defaultEvents, defaultCrises],
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
        />
    );
}

export default CountrySelectInput;
