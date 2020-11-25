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
import { GetEventQuery, GetEventQueryVariables } from '#generated/types';

import styles from './styles.css';

const EVENT = gql`
    query GetEvent($search: String){
        eventList(nameContains: $search){
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
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function EventSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetEventQueryVariables => ({ search: debouncedSearchText }),
        [debouncedSearchText],
    );

    const {
        loading,
        data,
    } = useQuery<GetEventQuery>(EVENT, {
        skip: !searchText,
        variables: searchVariable,
    });

    const searchOptions = data?.eventList?.results;

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={_cs(styles.eventSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default EventSelectInput;
