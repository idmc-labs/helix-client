import React from 'react';

import {
    TextInput,
} from '@togglecorp/toggle-ui';

import { MdTextFields } from 'react-icons/md';

interface SearchFormProps {
    searchText: string,
    onSearchTextChange: (text: string) => void,
}

function SearchForm(props: SearchFormProps) {
    const {
        searchText,
        onSearchTextChange,
    } = props;
    return (
        <TextInput
            value={searchText}
            onChange={onSearchTextChange}
            icons={<MdTextFields />}
        />
    );
}

export default SearchForm;
