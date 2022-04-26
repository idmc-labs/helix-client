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
import { GetViolenceContextQuery, GetViolenceContextQueryVariables } from '#generated/types';
import SearchMultiSelectInputWithChip from '#components/SearchMultiSelectInputWithChip';

import styles from './styles.css';

const VIOLENCE_CONTEXT = gql`
    query GetViolenceContext($name_Icontains: String, $ordering: String) {
        contextOfViolenceList(name_Icontains: $name_Icontains, ordering: $ordering) {
            totalCount
            results {
                id
                name
            }
        }
    }
`;

export type ViolenceContextOption = NonNullable<NonNullable<GetViolenceContextQuery['contextOfViolenceList']>['results']>[number];

const keySelector = (d: ViolenceContextOption) => d.id;
const labelSelector = (d: ViolenceContextOption) => d.name;

type Def = { containerClassName?: string };
type MultiSelectInputProps<
    K extends string,
    > = SearchMultiSelectInputProps<
        string,
        K,
        ViolenceContextOption,
        Def,
        'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
    > & { chip?: boolean };

function ViolenceContextMultiSelectInput<K extends string>(props: MultiSelectInputProps<K>) {
    const {
        className,
        chip,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetViolenceContextQueryVariables => (
            debouncedSearchText ? { name_Icontains: debouncedSearchText } : { ordering: '-createdAt' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetViolenceContextQuery>(VIOLENCE_CONTEXT, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.contextOfViolenceList?.results;
    const totalOptionsCount = data?.contextOfViolenceList?.totalCount;

    if (chip) {
        return (
            <SearchMultiSelectInputWithChip
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                className={_cs(styles.eventMultiSelectInput, className)}
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

    return (
        <SearchMultiSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={_cs(styles.eventMultiSelectInput, className)}
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

export default ViolenceContextMultiSelectInput;
