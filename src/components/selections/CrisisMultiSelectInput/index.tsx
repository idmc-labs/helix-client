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
import { GetCrisesQuery, GetCrisesQueryVariables } from '#generated/types';

import styles from './styles.css';

const CRISES = gql`
    query GetCrises($search: String, $countries: [String!], $ordering: String) {
        crisisList(name: $search, countries: $countries, ordering: $ordering) {
            totalCount
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
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    countries?: string[] | null,
};

function CrisisMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        countries,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCrisesQueryVariables => {
            if (!debouncedSearchText) {
                return {
                    ordering: '-created_at',
                    countries: countries ?? undefined,
                };
            }
            return {
                search: debouncedSearchText,
                countries: countries ?? undefined,
            };
        },
        [debouncedSearchText, countries],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetCrisesQuery>(CRISES, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.crisisList?.results;
    const totalOptionsCount = data?.crisisList?.totalCount;

    const [options, setOptions] = useOptions('crisis');

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.querytagSelectInput, className)}
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

export default CrisisMultiSelectInput;
