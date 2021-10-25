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
import { GetFigureTagListQuery, GetFigureTagListQueryVariables } from '#generated/types';

import styles from './styles.css';

const FIGURE_TAGS = gql`
    query GetFigureTagList($search: String, $ordering: String) {
        figureTagList(name_Unaccent_Icontains: $search, ordering: $ordering) {
            totalCount
            results {
                id
                name
            }
        }
    }
`;

export type FigureTagOption = NonNullable<NonNullable<GetFigureTagListQuery['figureTagList']>['results']>[number];

const keySelector = (d: FigureTagOption) => d.id;
const labelSelector = (d: FigureTagOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    FigureTagOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
>;

function FigureTagMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetFigureTagListQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'name' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetFigureTagListQuery>(FIGURE_TAGS, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.figureTagList?.results;
    const totalOptionsCount = data?.figureTagList?.totalCount;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.figureTagSelectInput, className)}
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

export default FigureTagMultiSelectInput;
