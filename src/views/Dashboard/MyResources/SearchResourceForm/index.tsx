import React from 'react';

import {
    TextInput,
} from '@togglecorp/toggle-ui';

import { MdTextFields } from 'react-icons/md';

interface SearchFormProps {
    searchText: string | undefined,
    onSearchTextChange: (text: string | undefined) => void,
}

// FIXME: why make a separate component for SearchForm?
function SearchForm(props: SearchFormProps) {
    const {
        searchText,
        onSearchTextChange,
    } = props;
    return (
        <TextInput
            name="search"
            value={searchText}
            onChange={onSearchTextChange}
            icons={<MdTextFields />}
        />
    );
}

export default SearchForm;
