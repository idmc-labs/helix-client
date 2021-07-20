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
import { GetFigureTermListQuery, GetFigureTermListQueryVariables } from '#generated/types';

import styles from './styles.css';

const FIGURE_TERMS = gql`
    query GetFigureTermList($isHousingRelated: Boolean, $ordering: String){
        figureTermList(isHousingRelated: $isHousingRelated, ordering: $ordering){
            totalCount
            results {
                id
                name
                isHousingRelated
            }
        }
    }
`;

export type FigureTermOption = NonNullable<NonNullable<
    GetFigureTermListQuery['figureTermList']>['results']>[number];

const keySelector = (d: FigureTermOption) => d.id;
const labelSelector = (d: FigureTermOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
    > = SearchMultiSelectInputProps<
        string,
        K,
        FigureTermOption,
        Def,
        'onSearchValueChange'
        | 'searchOptions' |
        'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
    >;

function FigureTagMultiSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState<string | undefined>();
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetFigureTermListQueryVariables => (
            debouncedSearchText ? { isHousingRelated: debouncedSearchText } : { ordering: 'name' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetFigureTermListQuery>(FIGURE_TERMS, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.figureTermList?.results;
    const totalOptionsCount = data?.figureTermList?.totalCount;

    return (
        <SearchMultiSelectInput
            {...otherProps}
            className={_cs(styles.figureTermSelectInput, className)}
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
