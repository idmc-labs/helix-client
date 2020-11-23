import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useLazyQuery,
} from '@apollo/client';

import SearchMultiSelectInput from '#components/SearchMultiSelectInput';

import styles from './styles.css';

const COUNTRY = gql`
    query GetCountry($search: String){
        countryList(name_Icontains: $search){
            results {
                id
                name
            }
        }
    }
`;

interface CountryOption {
    id: string;
    name?: string;
}

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.name;

interface CountriesSelectInputProps {
    className?: string;
    name: string;
    value?: string[];
    options: CountryOption[];
    onChange: (value?: string[], name?: string) => void;
}

function CountriesSelectInput(props: CountriesSelectInputProps) {
    const {
        className,
        name,
        onChange,
        options,
        value,
        ...otherProps
    } = props;

    const [searchText, setSearchText] = React.useState('');
    const timeoutRef = React.useRef<number | undefined>();
    const [
        getCountry,
        {
            loading,
            data,
        },
    ] = useLazyQuery(COUNTRY);

    React.useEffect(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }

        if (searchText?.length > 0) {
            timeoutRef.current = window.setTimeout(() => {
                getCountry({
                    variables: {
                        search: searchText,
                    },
                });
            }, 200);
        }
    }, [searchText, getCountry]);

    const handleOptionClick = React.useCallback((o) => {
        onChange(o, name);
    }, [onChange, name]);

    const handleSearchInputChange = React.useCallback((newSearchText) => {
        setSearchText(newSearchText);
    }, [setSearchText]);

    return (
        <div className={_cs(styles.countrySelectInput, className)}>
            <SearchMultiSelectInput
                {...otherProps}
                name=""
                value={value}
                onSearchValueChange={handleSearchInputChange}
                options={options}
                searchOptions={data?.countryList?.results ?? []}
                keySelector={keySelector}
                labelSelector={labelSelector}
                onChange={handleOptionClick}
                optionsPending={loading}
                nonClearable
            />
        </div>
    );
}

export default CountriesSelectInput;
