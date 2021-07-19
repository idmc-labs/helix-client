import React, { useMemo, useState } from 'react';
/* import {
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

export type FigureTagOption = NonNullable<NonNullable<
GetFigureTermListQuery['figureTagList']>['results']>[number];

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
        'onSearchValueChange'
         | 'searchOptions' |
         'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
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
        (): GetFigureTermListQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'name' }
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

    const searchOptions = data?.figureTagList?.results;
    const totalOptionsCount = data?.figureTagList?.totalCount;

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
*/
