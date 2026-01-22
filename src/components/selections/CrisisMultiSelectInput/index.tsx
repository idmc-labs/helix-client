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
import { GetCrisesQuery, GetCrisesQueryVariables } from '#generated/types';

import styles from './styles.module.css';

const CRISES = gql`
    query GetCrises(
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

export type CrisisOption = NonNullable<NonNullable<GetCrisesQuery['crisisList']>['results']>[number];

const keySelector = (d: CrisisOption) => d.id;
const labelSelector = (d: CrisisOption) => d.name;
const actionsSelector = (d: CrisisOption) => (
    <ButtonLikeLink
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
> = SearchMultiSelectInputProps<
    string,
    K,
    CrisisOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
> & {
    countries?: string[] | null,
};

function CrisisMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        countries,
        actions,
        ...otherProps
    } = props;

    const { user } = useContext(DomainContext);

    const currentUserId = user?.id;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const [crisisVisibilityFilter, setCrisisVisibilityFilter] = useState<'all' | 'createdByMe'>('all');

    const showOnlyCrisesCreatedByMe = crisisVisibilityFilter === 'createdByMe';

    const handleTabChange = useCallback((tabValue: 'all' | 'createdByMe' | undefined) => {
        if (!tabValue) {
            return;
        }
        setCrisisVisibilityFilter(tabValue);
    }, []);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCrisesQueryVariables => {
            if (!debouncedSearchText) {
                return {
                    ordering: '-created_at',
                    filters: {
                        countries: countries ?? undefined,
                        createdByIds: (
                            showOnlyCrisesCreatedByMe && isDefined(currentUserId)
                        ) ? [currentUserId] : emptyArray,
                    },
                };
            }
            return {
                filters: {
                    search: debouncedSearchText,
                    countries: countries ?? undefined,
                    createdByIds: (
                        showOnlyCrisesCreatedByMe && isDefined(currentUserId)
                    ) ? [currentUserId] : emptyArray,
                },
            };
        },
        [debouncedSearchText, countries, currentUserId, showOnlyCrisesCreatedByMe],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetCrisesQuery>(CRISES, {
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
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.querytagSelectInput, className)}
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
            actions={actions}
        />
    );
}

export default CrisisMultiSelectInput;
