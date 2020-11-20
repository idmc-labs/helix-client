import React from 'react';
import {
    _cs,
    listToMap,
} from '@togglecorp/fujs';
import { SelectInputContainer } from '@togglecorp/toggle-ui';
import {
    gql,
    useLazyQuery,
} from '@apollo/client';

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

function CountryOption(props) {
    const { label } = props;

    return label;
}

interface CountrySelectInputProps {
    className?: string;
    name: string;
    value?: string;
    onChange: (value?: string, name?: string) => void;
}

function CountrySelectInput(props: CountrySelectInputProps) {
    const {
        className,
        name,
        onChange,
        value,
    } = props;

    const [searchText, setSearchText] = React.useState('');
    const [optionMap, setOptionMap] = React.useState({});
    const timeoutRef = React.useRef<number | undefined>();
    const [
        getCountry,
        {
            loading,
            data,
        },
    ] = useLazyQuery(
        COUNTRY,
        {
            onCompleted: (response) => {
                const newOptions = listToMap(
                    response?.countryList?.results,
                    (d) => d.id,
                    (d) => d.name,
                );
                setOptionMap((oldOptions) => ({ ...oldOptions, ...newOptions }));
            },
        },
    );

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
            <SelectInputContainer
                name=""
                valueDisplay={optionMap[value]}
                onSearchInputChange={handleSearchInputChange}
                options={data?.countryList?.results ?? []}
                optionKeySelector={(d) => d.id}
                optionRenderer={CountryOption}
                optionRendererParams={(k, o) => ({ label: o.name })}
                optionsEmptyComponent={loading ? 'fetching...' : 'Nothing here'}
                onOptionClick={handleOptionClick}
            />
        </div>
    );
}

export default CountrySelectInput;
