import React, { useState, useContext } from 'react';
import {
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
} from '@togglecorp/toggle-ui';
import SearchMultiSelectInputWithChip from '#components/SearchMultiSelectInputWithChip';

import useDebouncedValue from '#hooks/useDebouncedValue';
import useOptions from '#hooks/useOptions';
import DomainContext from '#components/DomainContext';
import { GetOrganizationQuery } from '#generated/types';

import { ORGANIZATION } from '../OrganizationSelectInput/index';

import styles from './styles.css';

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
type MultiSelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    OrganizationOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    chip?: boolean,
    optionEditable?: boolean,
    onOptionEdit?: (value: string) => void,
    country?: string | null
};

function OrganizationMultiSelectInput<K extends string>(props: MultiSelectInputProps<K>) {
    const {
        className,
        chip,
        optionEditable,
        onOptionEdit,
        country,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetOrganizationQuery>(ORGANIZATION, {
        variables: {
            search: debouncedSearchText,
            ordering: debouncedSearchText || country
                ? undefined
                : 'name',
            countries: country ? [country] : undefined,
        },
        skip: !opened,
    });

    const searchOptions = data?.organizationList?.results;
    const totalOptionsCount = data?.organizationList?.totalCount;

    const { user } = useContext(DomainContext);
    const orgPermissions = user?.permissions?.organization;

    const [options, setOptions] = useOptions('organization');

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
                options={options}
                onOptionsChange={setOptions}
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
            options={options}
            onOptionsChange={setOptions}
        />
    );
}

export default OrganizationMultiSelectInput;
