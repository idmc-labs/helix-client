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
    query GetFigureTagList($search: String){
        figureTagList(name_Icontains: $search){
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
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function FigureTagMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetFigureTagListQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetFigureTagListQuery>(FIGURE_TAGS, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.figureTagList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.figureTagSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default FigureTagMultiSelectInput;
