import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    SearchSelectInput,
    SearchSelectInputProps,
    TextInput,
} from '@togglecorp/toggle-ui';

import NumberBlock from '#components/NumberBlock';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetEventListQuery, GetEventListQueryVariables } from '#generated/types';
import { EVENT_FRAGMENT } from '#components/forms/EntryForm/queries';

import styles from './styles.css';

const EVENT_LIST = gql`
    ${EVENT_FRAGMENT}
    query GetEventList($search: String, $ordering: String) {
        eventList(name: $search, ordering: $ordering) {
            totalCount
            results {
                ...EventResponse
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
        value,
        options,
        disabled,
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

    const selectedEvent = options?.find((event) => event.id === value);

    return (
        <>
            <SearchSelectInput
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                disabled={disabled}
                options={options}
                value={value}
                className={_cs(styles.eventListSelectInput, className)}
                keySelector={keySelector}
                labelSelector={labelSelector}
                onSearchValueChange={setSearchText}
                onShowDropdownChange={setOpened}
                searchOptions={searchOptions}
                optionsPending={loading}
                totalOptionsCount={totalOptionsCount ?? undefined}
            />
            {selectedEvent && (
                <>
                    {selectedEvent.eventType === 'CONFLICT' && (
                        <TextInput
                            label="Event Violence Type"
                            name="violenceSubType"
                            disabled={disabled}
                            readOnly
                            value={selectedEvent.violenceSubType?.name}
                        />
                    )}
                    {selectedEvent.eventType === 'DISASTER' && (
                        <TextInput
                            label="Event Hazard Type"
                            name="disasterSubType"
                            disabled={disabled}
                            readOnly
                            value={selectedEvent.disasterSubType?.name}
                        />
                    )}
                    {selectedEvent.eventType === 'OTHER' && (
                        <TextInput
                            label="Event Other SubType"
                            name="otherSubType"
                            disabled={disabled}
                            readOnly
                            value={selectedEvent.otherSubType?.name}
                        />
                    )}
                    <div className={styles.block}>
                        <NumberBlock
                            className={styles.numberBlock}
                            label="New displacements"
                            value={selectedEvent?.totalFlowNdFigures}
                        />
                        <NumberBlock
                            className={styles.numberBlock}
                            label="No. of IDPs"
                            value={selectedEvent?.totalStockIdpFigures}
                        />
                    </div>
                </>
            )}
        </>
    );
}

export default EventSelectInput;
