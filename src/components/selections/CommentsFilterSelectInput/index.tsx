import React from 'react';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface CommentsFilterOption {
    name: string;
    value: string;
}

const keySelector = (d: CommentsFilterOption) => d.value;
const labelSelector = (d: CommentsFilterOption) => d.name;

type Def = { containerClassName?: string };
type SelectInputProps<
    K extends string,
    > = SearchSelectInputProps<
        string,
        K,
        CommentsFilterOption,
        Def,
        'onSearchValueChange' | 'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalCount'
    >;

function CommentsFilterSelectInput<K extends string>(props: SelectInputProps<K>) {
    const {
        className,
        ...otherProps
    } = props;

    const searchOptions = [
        {
            name: 'Has Comments',
            value: 'true',
        },
        {
            name: ' Has No comments',
            value: 'false',
        },
    ];

    return (
        <SearchSelectInput
            {...otherProps}
            className={_cs(styles.selectFilterInput, className)}
            keySelector={keySelector}
            labelSelector={labelSelector}
            searchOptions={searchOptions}
        />
    );
}
export default CommentsFilterSelectInput;
