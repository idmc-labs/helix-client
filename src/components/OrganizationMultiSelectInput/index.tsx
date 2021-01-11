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
import { GetOrganizationQuery, GetOrganizationQueryVariables } from '#generated/types';

import styles from './styles.css';

const ORGANIZATION = gql`
    query GetOrganization($search: String){
        organizationList(name_Icontains: $search){
            results {
                id
                name
                methodology
                breakdown
            }
        }
    }
`;

export type OrganizationOption = NonNullable<NonNullable<GetOrganizationQuery['organizationList']>['results']>[number];

const keySelector = (d: OrganizationOption) => d.id;
const labelSelector = (d: OrganizationOption) => d.name;

type Def = { containerClassName?: string };
type MultiSelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    OrganizationOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function OrganizationMultiSelectInput<K extends string>(props: MultiSelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetOrganizationQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        data,
    } = useQuery<GetOrganizationQuery>(ORGANIZATION, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.organizationList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.organizationMultiSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default OrganizationMultiSelectInput;
