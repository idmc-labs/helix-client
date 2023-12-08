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

import useOptions from '#hooks/useOptions';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetCrisisQuery, GetCrisisQueryVariables } from '#generated/types';

import styles from './styles.css';

const CRISIS = gql`
    query GetCrisis($search: String, $countries: [String!], $ordering: String) {
        crisisList(name: $search, countries: $countries, ordering: $ordering) {
            totalCount
            results {
                id
                name
            }
        }
    }
`;

export type CrisisOption = NonNullable<NonNullable<GetCrisisQuery['crisisList']>['results']>[number];

const keySelector = (d: CrisisOption) => d.id;
const labelSelector = (d: CrisisOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    CrisisOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    countries?: string[] | null,
};

function CrisisSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        countries,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCrisisQueryVariables => {
            if (!debouncedSearchText) {
                return {
                    ordering: '-createdAt',
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
    } = useQuery<GetCrisisQuery>(CRISIS, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.crisisList?.results;
    const totalOptionsCount = data?.crisisList?.totalCount;

    const [options, setOptions] = useOptions('crisis');

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={_cs(styles.crisisSelectInput, className)}
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

export default CrisisSelectInput;
