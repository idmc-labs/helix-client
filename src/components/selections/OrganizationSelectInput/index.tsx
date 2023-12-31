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
import { GetOrganizationQuery, GetOrganizationQueryVariables } from '#generated/types';

import styles from './styles.css';

export const ORGANIZATION = gql`
    query GetOrganization(
        $ordering: String,
        $filters: OrganizationFilterDataInputType,
    ) {
        organizationList(
        ordering: $ordering,
        filters: $filters,
    ) {
            totalCount
            results {
                id
                name
                methodology
                countries {
                    id
                    idmcShortName
                }
                organizationKind {
                    id
                    name
                    reliability
                }
            }
        }
    }
`;

export type OrganizationOption = NonNullable<NonNullable<GetOrganizationQuery['organizationList']>['results']>[number];

const keySelector = (d: OrganizationOption) => d.id;

function labelSelector(org: OrganizationOption) {
    const countries = org.countries
        .map((country) => country.idmcShortName)
        .join(', ');

    return countries
        ? `${org.name} - ${countries}`
        : org.name;
}

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    OrganizationOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    country?: string | null
};

function OrganizationSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        country,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetOrganizationQueryVariables => ({
            ordering: debouncedSearchText || country
                ? undefined
                : 'name',
            filters: {
                name_Unaccent_Icontains: debouncedSearchText,
                orderCountryFirst: country ? [country] : undefined,
            },
        }),
        [debouncedSearchText, country],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetOrganizationQuery>(ORGANIZATION, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.organizationList?.results;
    const totalOptionsCount = data?.organizationList?.totalCount;

    const [options, setOptions] = useOptions('organization');

    return (
        <SearchSelectInput
            {...otherProps}
            className={_cs(styles.organizationSelectInput, className)}
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

export default OrganizationSelectInput;
