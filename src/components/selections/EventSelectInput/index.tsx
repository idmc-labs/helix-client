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
import { GetEventQuery, GetEventQueryVariables } from '#generated/types';

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
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    EventOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    countries?: string[] | null;
    crises?: string[] | null;
};

function EventSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        countries,
        crises,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetEventQueryVariables => (
            debouncedSearchText ? {
                search: debouncedSearchText,
                countries,
                crises,
            } : {
                ordering: '-createdAt',
                countries,
                crises,
            }
        ),
        [debouncedSearchText, countries, crises],
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

    const [options, setOptions] = useOptions('event');

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={_cs(styles.eventSelectInput, className)}
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

export default EventSelectInput;
