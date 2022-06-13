import React, { useMemo, useState, useContext } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
} from '@togglecorp/toggle-ui';
import SearchMultiSelectInputWithChip from '#components/SearchMultiSelectInputWithChip';

import useDebouncedValue from '#hooks/useDebouncedValue';
import DomainContext from '#components/DomainContext';
import { GetOrganizationQuery, GetOrganizationQueryVariables } from '#generated/types';

import styles from './styles.css';

const ORGANIZATION = gql`
    query GetOrganization($search: String, $ordering: String) {
        organizationList(name_Unaccent_Icontains: $search, ordering: $ordering) {
            totalCount
            results {
                id
                name
                methodology
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
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
> & { chip?: boolean, optionEditable?: boolean, onOptionEdit?: (value: string) => void };

function OrganizationMultiSelectInput<K extends string>(props: MultiSelectInputProps<K>) {
    const {
        className,
        chip,
        optionEditable,
        onOptionEdit,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetOrganizationQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'name' }
        ),
        [debouncedSearchText],
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

    const { user } = useContext(DomainContext);
    const orgPermissions = user?.permissions?.organization;

    if (chip) {
        return (
            <SearchMultiSelectInputWithChip
                {...otherProps}
                className={_cs(styles.organizationMultiSelectInput, className)}
                keySelector={keySelector}
                labelSelector={labelSelector}
                onSearchValueChange={setSearchText}
                onShowDropdownChange={setOpened}
                searchOptions={searchOptions}
                optionsPending={loading}
                totalOptionsCount={totalOptionsCount ?? undefined}
                optionEditable={optionEditable && orgPermissions?.change}
                onOptionEdit={onOptionEdit}
            />
        );
    }

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.organizationMultiSelectInput, className)}
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

export default OrganizationMultiSelectInput;
