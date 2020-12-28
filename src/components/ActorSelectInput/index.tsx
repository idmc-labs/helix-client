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
    query GetActor($search: String){
        actorList(name_Icontains: $search){
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
    'onSearchValueChange' | 'searchOptions' | 'searchOptionsShownInitially' | 'optionsPending' | 'keySelector' | 'labelSelector'
>;

function ActorSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = useState('');

    const debouncedSearchText = useDebouncedValue(searchText);

    const searchVariable = useMemo(
        (): GetActorQueryVariables => ({ search: debouncedSearchText }),
        [debouncedSearchText],
    );

    const {
        loading,
        data,
    } = useQuery<GetActorQuery>(ACTOR, {
        skip: !debouncedSearchText,
        variables: searchVariable,
    });

    const searchOptions = data?.actorList?.results;

    return (
        <SearchSelectInput
            {...otherProps}
            className={_cs(styles.actorSelectInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            onSearchValueChange={setSearchText}
            searchOptions={searchOptions}
            optionsPending={loading}
            searchOptionsShownInitially={false}
        />
    );
}

export default ActorSelectInput;
