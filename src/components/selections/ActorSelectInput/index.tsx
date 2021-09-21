import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@togglecorp/toggle-ui';

import useDebouncedValue from '#hooks/useDebouncedValue';
import { GetActorQuery, GetActorQueryVariables } from '#generated/types';

import styles from './styles.css';

const ACTOR = gql`
    query GetActor($search: String, $ordering: String){
        actorList(name_Unaccent_Icontains: $search, ordering: $ordering){
            totalCount
            results {
                id
                name
            }
        }
    }
`;

export type ActorOption = NonNullable<NonNullable<GetActorQuery['actorList']>['results']>[number];

const keySelector = (d: ActorOption) => d.id;
const labelSelector = (d: ActorOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
> = SearchSelectInputProps<
    string,
    K,
    ActorOption,
    Def,
    'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount'
>;

function ActorSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');
    const [opened, setOpened] = useState(false);

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetActorQueryVariables => (
            debouncedSearchText ? { search: debouncedSearchText } : { ordering: 'name' }
        ),
        [debouncedSearchText],
    );

    const {
        loading,
        previousData,
        data = previousData,
    } = useQuery<GetActorQuery>(ACTOR, {
        variables: searchVariable,
        skip: !opened,
    });

    const searchOptions = data?.actorList?.results;
    const totalOptionsCount = data?.actorList?.totalCount;

    return (
        <SearchSelectInput
            {...otherProps}
            className={_cs(styles.actorSelectInput, className)}
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

export default ActorSelectInput;
