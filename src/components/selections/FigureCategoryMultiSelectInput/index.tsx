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
    query GetFigureCategories($search: String, $ordering: String){
        figureCategoryList(name_Icontains: $search, ordering: $ordering){
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
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function FigureCategoryMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetFigureCategoriesQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'name' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetFigureCategoriesQuery>(FIGURE_CATEGORIES, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.figureCategoryList?.results;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.figureCategorySelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            onShowDropdownChange={setOpened}
            searchOptions={searchOptions}
            optionsPending={loading}
        />
    );
}

export default FigureCategoryMultiSelectInput;
