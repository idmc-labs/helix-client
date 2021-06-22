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
import {
    GetCountriesQuery,
    GetCountriesQueryVariables,
    ManageCordinatorQuery,
    ManageCordinatorQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const COUNTRIES = gql`
    query GetCountries($search: String, $regions: [String!], $ordering: String){
        countryList(countryName: $search, regionByIds: $regions, ordering: $ordering){
            totalCount
            results {
                id
                idmcShortName
                boundingBox
                iso2
            }
        }
    }
`;

const CORDINATOR_INFO = gql`
    query cordinatorMultiSelect($page: Int, $pageSize: Int) {
        monitoringSubRegionList(page: $page, pageSize: $pageSize) {
            results {
              id
              name
              countries {
                results {
                  id
                  idmcShortName
                  monitoringExpert {
                    id
                    user {
                      id
                      fullName
                    }
                  }
                }
              }
            }
        }
    }
`;

export type CordinatorOption = NonNullable<NonNullable<ManageCordinatorQuery['monitoringSubRegionList']>['results']>[number];

const keySelector = (d: CordinatorOption) => d.countries?.r;
const labelSelector = (d: CordinatorOption) => d.idmcShortName;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
    > = SearchMultiSelectInputProps<
        string,
        K,
        CordinatorOption,
        Def,
        'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
    > & {
        regions?: string[],
    };

function CordinatorMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        regions,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetCountriesQueryVariables => {
            if (!debouncedSearchText) {
                return { ordering: 'idmcShortName' };
            }
            return {
                search: debouncedSearchText,
                regions: regions ?? undefined,
            };
        },
        [debouncedSearchText, regions],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetCountriesQuery>(COUNTRIES, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.countryList?.results;
    const totalOptionsCount = data?.countryList?.totalCount;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.countrySelectInput, className)}
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

export default CordinatorMultiSelectInput;
