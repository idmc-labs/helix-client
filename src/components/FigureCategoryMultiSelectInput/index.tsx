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
import { GetFigureCategoriesQuery, GetFigureCategoriesQueryVariables } from '#generated/types';

import styles from './styles.css';

const FIGURE_CATEGORIES = gql`
    query GetFigureCategories($search: String){
        figureCategoryList(name_Icontains: $search){
            results {
                id
                name
            }
        }
    }
`;

export type FigureCategoryOption = NonNullable<NonNullable<GetFigureCategoriesQuery['figureCategoryList']>['results']>[number];

const keySelector = (d: FigureCategoryOption) => d.id;
const labelSelector = (d: FigureCategoryOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchMultiSelectInputProps<
    string,
    K,
    FigureCategoryOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function FigureCategoryMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetFigureCategoriesQueryVariables | undefined => (
            debouncedSearchText ? { search: debouncedSearchText } : undefined
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        data,
    } = useQuery<GetFigureCategoriesQuery>(FIGURE_CATEGORIES, {
        skip: !searchVariable,
        variables: searchVariable,
    });

    const searchOptions = data?.figureCategoryList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.figureCategorySelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default FigureCategoryMultiSelectInput;
