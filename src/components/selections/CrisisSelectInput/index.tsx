import React, {
    useCallback,
    useContext,
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
import { GetCrisisQuery, GetCrisisQueryVariables } from '#generated/types';

import styles from './styles.module.css';

const CRISIS = gql`
    query GetCrisis(
        $filters: CrisisFilterDataInputType,
        $ordering: String,
    ) {
        crisisList(
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

export type CrisisOption = NonNullable<NonNullable<GetCrisisQuery['crisisList']>['results']>[number];

const keySelector = (d: CrisisOption) => d.id;
const labelSelector = (d: CrisisOption) => d.name;
const actionsSelector = (d: CrisisOption) => (
    <ButtonLikeLink
        className={styles.actionButton}
        route={route.crisis}
        attrs={{ crisisId: d.id }}
        title="Open Crisis"
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
    CrisisOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    countries?: string[] | null,
};

function CrisisSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        countries,
        actions,
        value,
        ...otherProps
    } = props;

    const { user } = useContext(DomainContext);

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const [crisisVisibilityFilter, setCrisisVisibilityFilter] = useState<'all' | 'createdByMe'>('all');

    const showOnlyCrisesCreatedByMe = crisisVisibilityFilter === 'createdByMe';

    const handleTabChange = useCallback((tabValue: 'all' | 'createdByMe' | undefined) => {
        if (!tabValue) {
            return;
        }
        setCrisisVisibilityFilter(tabValue);
    }, []);

    const currentUserId = user?.id;

    const searchVariable = useMemo(
        (): GetCrisisQueryVariables => ({
            ordering: '-start_date',
            filters: {
                search: debouncedSearchText ?? '',
                countries: countries ?? undefined,
                createdByIds: (
                    showOnlyCrisesCreatedByMe && isDefined(currentUserId)
                ) ? [currentUserId] : emptyArray,
            },
        }),
        [debouncedSearchText, countries, currentUserId, showOnlyCrisesCreatedByMe],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetCrisisQuery>(CRISIS, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.crisisList?.results;
    const totalOptionsCount = data?.crisisList?.totalCount;

    const [options, setOptions] = useOptions('crisis');
    const handleDropdownChange = useCallback((newVal: boolean) => {
        setCrisisVisibilityFilter('all');
        setOpened(newVal);
    }, []);

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            value={value}
            className={_cs(styles.crisisSelectInput, className)}
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
            popupHeader={(
                <Tabs
                    value={crisisVisibilityFilter}
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
                            route={route.crisis}
                            attrs={{ crisisId: value }}
                            transparent
                            compact
                            title="Open Crisis"
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

export default CrisisSelectInput;
