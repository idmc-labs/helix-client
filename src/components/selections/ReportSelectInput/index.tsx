import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@togglecorp/toggle-ui';

import useOptions from '#hooks/useOptions';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetReportQuery, GetReportQueryVariables } from '#generated/types';

const REPORT = gql`
    query GetReport($search: String, $ordering: String) {
        reportList(name_Unaccent_Icontains: $search, ordering: $ordering) {
            totalCount
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
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'options' | 'onOptionsChange'
>;

function ReportSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetReportQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: '-createdAt' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetReportQuery>(REPORT, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.reportList?.results;
    const totalOptionsCount = data?.reportList?.totalCount;

    const [options, setOptions] = useOptions('report');

    return (
        <SearchSelectInput
            {...otherProps}
            className={className}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={setOpened}
            searchOptions={searchOptions}
            optionsPending={loading}
            totalOptionsCount={totalOptionsCount ?? undefined}
            options={options}
            onOptionsChange={setOptions}
        />
    );
}

export default ReportSelectInput;
