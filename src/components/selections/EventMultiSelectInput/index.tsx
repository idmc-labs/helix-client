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
import { GetEventQuery, GetEventQueryVariables } from '#generated/types';
import SearchMultiSelectInputWithChip from '#components/SearchMultiSelectInputWithChip';

import styles from './styles.css';

const EVENT = gql`
    query GetEvent(
        $search: String,
        $crises: [ID!],
        $countries: [ID!],
        $ordering: String,
    ) {
        eventList(
            name: $search,
            ordering: $ordering,
            crisisByIds: $crises,
            countries: $countries,
        ) {
            totalCount
            results {
                id
                name
            }
        }
    }
`;

export type EventOption = NonNullable<NonNullable<GetEventQuery['eventList']>['results']>[number];

const keySelector = (d: EventOption) => d.id;
const labelSelector = (d: EventOption) => d.name;

type Def = { containerClassName?: string };
type MultiSelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    EventOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
> & {
    chip?: boolean,
    defaultCountries?: string[];
    defaultCrises?: string[];
};

function EventMultiSelectInput<K extends string>(props: MultiSelectInputProps<K>) {
    const {
        className,
        chip,
        defaultCountries,
        defaultCrises,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetEventQueryVariables => (
            debouncedSearchText ? {
                search: debouncedSearchText,
                countries: defaultCountries,
                crises: defaultCrises,
            } : {
                ordering: '-createdAt',
                countries: defaultCountries,
                crises: defaultCrises,
            }
        ),
        [debouncedSearchText, defaultCountries, defaultCrises],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetEventQuery>(EVENT, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.eventList?.results;
    const totalOptionsCount = data?.eventList?.totalCount;

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

export default EventMultiSelectInput;
