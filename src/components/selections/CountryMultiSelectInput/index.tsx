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
import { IoOpenOutline } from 'react-icons/io5';

import route from '#config/routes';
import ButtonLikeLink from '#components/ButtonLikeLink';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useOptions from '#hooks/useOptions';
import { GetCountriesQuery, GetCountriesQueryVariables } from '#generated/types';

import styles from './styles.module.css';

const COUNTRIES = gql`
    query GetCountries(
        $ordering: String,
        $filters: CountryFilterDataInputType,
    ) {
        countryList(
            ordering: $ordering,
            filters: $filters,
        ) {
            totalCount
            results {
                id
                idmcShortName
                boundingBox
                geojsonUrl
                iso2
            }
        }
    }
`;

export type CountryOption = NonNullable<NonNullable<GetCountriesQuery['countryList']>['results']>[number];

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.idmcShortName;
const actionsSelector = (d: CountryOption) => (
    <ButtonLikeLink
        className={styles.actionButton}
        route={route.country}
        attrs={{ countryId: d.id }}
        title="Open Country"
        target="_blank"
        rel="noopener noreferrer"
        compact
        transparent
    >
        <IoOpenOutline />
    </ButtonLikeLink>
);

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    CountryOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    regions?: string[] | null,
    events?: string[] | null;
    crises?: string[] | null;
};

function CountryMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
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
        (): GetCountriesQueryVariables => ({
            ordering: 'idmc_short_name',
            filters: {
                search: debouncedSearchText ?? '',
                regionByIds: regions ?? undefined,
                events,
                crises,
            },
        }),
        [debouncedSearchText, regions, events, crises],
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

    const [options, setOptions] = useOptions('country');

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.countrySelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            actionsSelector={actionsSelector}
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

export default CountryMultiSelectInput;
