import React, { useMemo, useState, useContext } from 'react';
import {
    useQuery,
} from '@apollo/client';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
} from '@togglecorp/toggle-ui';
import SearchMultiSelectInputWithChip from '#components/SearchMultiSelectInputWithChip';

import useDebouncedValue from '#hooks/useDebouncedValue';
import DomainContext from '#components/DomainContext';
import { GetOrganizationQuery, GetOrganizationQueryVariables } from '#generated/types';

import { ORGANIZATION } from '../OrganizationSelectInput/index';

import styles from './styles.css';

function labelGenerator(org: OrganizationOption) {
    if (org?.countries?.length > 0) {
        return `${org.name} - ${org.countries?.map((country) => country.name).filter(isDefined).join(', ')}`;
    }
    return org.name;
}

export type OrganizationOption = NonNullable<NonNullable<GetOrganizationQuery['organizationList']>['results']>[number];

const keySelector = (d: OrganizationOption) => d.id;
const labelSelector = (d: OrganizationOption) => labelGenerator(d);

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
