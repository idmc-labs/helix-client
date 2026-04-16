import React, {
    useContext,
    useCallback,
    useMemo,
    useState,
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
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
    Tabs,
    TabList,
    Tab,
} from '@togglecorp/toggle-ui';
import {
    IoOpenOutline,
} from 'react-icons/io5';

import ButtonLikeLink from '#components/ButtonLikeLink';
import DomainContext from '#components/DomainContext';
import route from '#config/routes';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useOptions from '#hooks/useOptions';
import { GetEventQuery, GetEventQueryVariables } from '#generated/types';
import SearchMultiSelectInputWithChip from '#components/SearchMultiSelectInputWithChip';

import styles from './styles.module.css';

const EVENT = gql`
    query GetEvent(
        $filters: EventFilterDataInputType,
        $ordering: String,
    ) {
        eventList(
            ordering: $ordering,
            filters: $filters,
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

const emptyArray: string[] = [];

const keySelector = (d: EventOption) => d.id;
const labelSelector = (d: EventOption) => d.name;
const actionsSelector = (d: EventOption) => (
    <ButtonLikeLink
        className={styles.actionButton}
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

type Def = { containerClassName?: string };
type MultiSelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    EventOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    chip?: boolean,
    countries?: string[] | null;
    crises?: string[] | null;
};

function EventMultiSelectInput<K extends string>(props: MultiSelectInputProps<K>) {
    const {
        className,
        chip,
        countries,
        crises,
        ...otherProps
    } = props;

    const { user } = useContext(DomainContext);

    const currentUserId = user?.id;
    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const [eventVisibilityFilter, setEventVisibilityFilter] = useState<'all' | 'createdByMe'>('all');

    const handleDropdownChange = useCallback((newVal: boolean) => {
        setEventVisibilityFilter('all');
        setOpened(newVal);
    }, []);

    const showOnlyEventsCreatedByMe = eventVisibilityFilter === 'createdByMe';

    const handleTabChange = useCallback((tabValue: 'all' | 'createdByMe' | undefined) => {
        if (!tabValue) {
            return;
        }
        setEventVisibilityFilter(tabValue);
    }, []);

    const searchVariable = useMemo(
        (): GetEventQueryVariables => (
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
    } = useQuery<GetEventQuery>(EVENT, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.eventList?.results;
    const totalOptionsCount = data?.eventList?.totalCount;

    const [options, setOptions] = useOptions('event');

    const popupHeader = (
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
    );

    if (chip) {
        return (
            <SearchMultiSelectInputWithChip
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                className={_cs(styles.eventMultiSelectInput, className)}
                keySelector={keySelector}
                labelSelector={labelSelector}
                actionsSelector={actionsSelector}
                onSearchValueChange={setSearchText}
                onShowDropdownChange={handleDropdownChange}
                searchOptions={searchOptions}
                optionsPending={loading}
                totalOptionsCount={totalOptionsCount ?? undefined}
                options={options}
                onOptionsChange={setOptions}
                optionsPopupClassName={styles.popup}
                optionsPopupContentClassName={styles.popupContent}
                popupHeaderClassName={styles.tabList}
                popupHeader={popupHeader}
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
            actionsSelector={actionsSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={handleDropdownChange}
            searchOptions={searchOptions}
            optionsPending={loading}
            totalOptionsCount={totalOptionsCount ?? undefined}
            options={options}
            onOptionsChange={setOptions}
            optionsPopupClassName={styles.popup}
            optionsPopupContentClassName={styles.popupContent}
            popupHeaderClassName={styles.tabList}
            popupHeader={popupHeader}
        />
    );
}

export default EventMultiSelectInput;
