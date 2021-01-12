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
import { GetCrisesQuery, GetCrisesQueryVariables } from '#generated/types';

import styles from './styles.css';

const CRISES = gql`
    query GetCrises($search: String, $countries: [String]){
        crisisList(name_Icontains: $search, countries: $countries){
            results {
                id
                name
            }
        }
    }
`;

export type CrisisOption = NonNullable<NonNullable<GetCrisesQuery['crisisList']>['results']>[number];

const keySelector = (d: CrisisOption) => d.id;
const labelSelector = (d: CrisisOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    CrisisOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'countries'
> & {
    countries?: string[],
};

function CrisisMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        countries,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCrisesQueryVariables | undefined => {
            if (!debouncedSearchText) {
                return undefined;
            }
            if (!countries) {
                return {
                    search: debouncedSearchText,
                };
            }
            return {
                search: debouncedSearchText,
                countries,
            };
        },
        [debouncedSearchText, countries],
    );

    const {
        loading,
        data,
    } = useQuery<GetCrisesQuery>(CRISES, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.crisisList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.querytagSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default CrisisMultiSelectInput;
