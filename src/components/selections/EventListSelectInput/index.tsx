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
import { GetEventListQuery, GetEventListQueryVariables } from '#generated/types';

import styles from './styles.css';

const EVENT_LIST = gql`
    query GetEventList($search: String, $ordering: String) {
        eventList(name: $search, ordering: $ordering) {
            totalCount
            results {
                id
                name
                countries {
                    id
                    idmcShortName
                    boundingBox
                    iso2
                }
                eventType
                violenceSubType {
                    id
                    name
                }
                osvSubType {
                    id
                    name
                }
                otherSubType {
                    id
                    name
                }
                disasterSubType {
                    id
                    name
                }
                contextOfViolence {
                    id
                    name
                }
            }
        }
    }
`;

export type EventListOption = NonNullable<NonNullable<GetEventListQuery['eventList']>['results']>[number];

const keySelector = (d: EventListOption) => d.id;
const labelSelector = (d: EventListOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
    > = SearchSelectInputProps<
        string,
        K,
        EventListOption,
        Def,
        'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
    >;

function EventSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetEventListQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: '-createdAt' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetEventListQuery>(EVENT_LIST, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.eventList?.results;
    const totalOptionsCount = data?.eventList?.totalCount;

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={_cs(styles.eventListSelectInput, className)}
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

export default EventSelectInput;
