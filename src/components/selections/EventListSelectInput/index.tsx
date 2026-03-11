import React, {
    useMemo,
    useCallback,
    useState,
    useContext,
} from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    SearchSelectInput,
    SearchSelectInputProps,
    TextInput,
    Tabs,
    TabList,
    Tab,
} from '@togglecorp/toggle-ui';
import {
    IoOpenOutline,
} from 'react-icons/io5';

import NumberBlock from '#components/NumberBlock';
import ButtonLikeLink from '#components/ButtonLikeLink';
import DomainContext from '#components/DomainContext';
import route from '#config/routes';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetEventListQuery, GetEventListQueryVariables } from '#generated/types';
import { EVENT_FRAGMENT } from '#components/forms/EntryForm/queries';

import styles from './styles.module.css';

const EVENT_LIST = gql`
    ${EVENT_FRAGMENT}
    query GetEventList(
        $filters: EventFilterDataInputType,
        $ordering: String,
    ) {
        eventList(
            ordering: $ordering,
            filters: $filters,
        ) {
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
const actionsSelector = (d: EventListOption) => (
    <ButtonLikeLink
        route={route.event}
        attrs={{ eventId: d.id }}
        title="Open Event"
        target="_blank"
        rel="noopener noreferrer"
        compact
        transparent
    >
        <IoOpenOutline />
    </ButtonLikeLink>
);

const emptyArray: string[] = [];
type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    EventListOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
> & {
    countries?: string[] | null;
    crises?: string[] | null;
};

function EventListSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        value,
        options,
        disabled,
        countries,
        crises,
        ...otherProps
    } = props;

    const { user } = useContext(DomainContext);

    const [eventVisibilityFilter, setEventVisibilityFilter] = useState<'all' | 'createdByMe'>('all');

    const showOnlyEventsCreatedByMe = eventVisibilityFilter === 'createdByMe';

    const handleTabChange = useCallback((tabValue: 'all' | 'createdByMe' | undefined) => {
        if (!tabValue) {
            return;
        }
        setEventVisibilityFilter(tabValue);
    }, []);

    const currentUserId = user?.id;
    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetEventListQueryVariables => (
            debouncedSearchText ? {
                filters: {
                    search: debouncedSearchText,
                    countries,
                    crisisByIds: crises,
                    createdByIds: (
                        showOnlyEventsCreatedByMe && isDefined(currentUserId)
                    ) ? [currentUserId] : emptyArray,
                },
            } : {
                ordering: '-created_at',
                filters: {
                    countries,
                    crisisByIds: crises,
                    createdByIds: (
                        showOnlyEventsCreatedByMe && isDefined(currentUserId)
                    ) ? [currentUserId] : emptyArray,
                },
            }
        ),
        [debouncedSearchText, countries, crises, currentUserId, showOnlyEventsCreatedByMe],
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
    const handleDropdownChange = useCallback((newVal: boolean) => {
        setEventVisibilityFilter('all');
        setOpened(newVal);
    }, []);

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
                actionsSelector={actionsSelector}
                onSearchValueChange={setSearchText}
                onShowDropdownChange={handleDropdownChange}
                searchOptions={searchOptions}
                optionsPending={loading}
                totalOptionsCount={totalOptionsCount ?? undefined}
                optionsPopupClassName={styles.popup}
                optionsPopupContentClassName={styles.popupContent}
                popupHeaderClassName={styles.tabList}
                popupHeader={(
                    <Tabs
                        value={eventVisibilityFilter}
                        onChange={handleTabChange}
                    >
                        <TabList>
                            <Tab
                                className={styles.tab}
                                name="all"
                            >
                                All
                            </Tab>
                            <Tab
                                className={styles.tab}
                                name="createdByMe"
                            >
                                Created By Me
                            </Tab>
                        </TabList>
                    </Tabs>
                )}
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
                            label="Internal displacements"
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

export default EventListSelectInput;
