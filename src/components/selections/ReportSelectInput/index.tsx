import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@togglecorp/toggle-ui';

import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetReportQuery, GetReportQueryVariables } from '#generated/types';

const REPORT = gql`
    query GetReport($search: String){
        reportList(name_Icontains: $search){
            results {
                id
                name
            }
        }
    }
`;

export type ReportOption = NonNullable<NonNullable<GetReportQuery['reportList']>['results']>[number];

const keySelector = (d: ReportOption) => d.id;
const labelSelector = (d: ReportOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    ReportOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function ReportSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetReportQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetReportQuery>(REPORT, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.reportList?.results;

    return (
        <SearchSelectInput
            {...otherProps}
            className={className}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default ReportSelectInput;
