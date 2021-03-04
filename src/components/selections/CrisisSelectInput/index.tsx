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
import { GetCrisisQuery, GetCrisisQueryVariables } from '#generated/types';

import styles from './styles.css';

const CRISIS = gql`
    query GetCrisis($search: String){
        crisisList(name_Icontains: $search){
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
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function CrisisSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCrisisQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetCrisisQuery>(CRISIS, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.crisisList?.results;

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={_cs(styles.crisisSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default CrisisSelectInput;
