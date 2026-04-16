import React, {
    useMemo,
    useState,
    useContext,
    useCallback,
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
import useOptions from '#hooks/useOptions';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetEventQuery, GetEventQueryVariables } from '#generated/types';

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

const emptyArray: string[] = [];
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
        actions,
        value,
        ...otherProps
    } = props;

    const { user } = useContext(DomainContext);

    const currentUserId = user?.id;
    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const [eventVisibilityFilter, setEventVisibilityFilter] = useState<'all' | 'createdByMe'>('all');

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
    const handleDropdownChange = useCallback((newVal: boolean) => {
        setEventVisibilityFilter('all');
        setOpened(newVal);
    }, []);

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            value={value}
            className={_cs(styles.eventSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={handleDropdownChange}
            searchOptions={searchOptions}
            optionsPending={loading}
            totalOptionsCount={totalOptionsCount ?? undefined}
            options={options}
            onOptionsChange={setOptions}
            actionsSelector={actionsSelector}
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
            actions={(
                <>
                    {value && (
                        <ButtonLikeLink
                            route={route.event}
                            attrs={{ eventId: value }}
                            transparent
                            compact
                            title="Open Event"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <IoOpenOutline />
                        </ButtonLikeLink>
                    )}
                    {actions}
                </>
            )}
        />
    );
}

export default EventSelectInput;
