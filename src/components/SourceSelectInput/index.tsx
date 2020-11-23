import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useLazyQuery,
} from '@apollo/client';

import SearchSelectInput from '#components/SearchSelectInput';

import styles from './styles.css';

const ORGANIZATION = gql`
    query GetOrganization($search: String){
        organizationList(name_Icontains: $search){
            results {
                id
                name
            }
        }
    }
`;

interface OrganizationOption {
    id: string;
    name?: string;
}

const keySelector = (d: OrganizationOption) => d.id;
const labelSelector = (d: OrganizationOption) => d.name;

interface OrganizationSelectInputProps {
    className?: string;
    name: string;
    value?: string;
    options: OrganizationOption[];
    onChange: (value?: string, name?: string) => void;
}

function OrganizationSelectInput(props: OrganizationSelectInputProps) {
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
        getOrganization,
        {
            loading,
            data,
        },
    ] = useLazyQuery(ORGANIZATION);

    React.useEffect(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }

        if (searchText?.length > 0) {
            timeoutRef.current = window.setTimeout(() => {
                getOrganization({
                    variables: {
                        search: searchText,
                    },
                });
            }, 200);
        }
    }, [searchText, getOrganization]);

    const handleOptionClick = React.useCallback((o) => {
        onChange(o, name);
    }, [onChange, name]);

    const handleSearchInputChange = React.useCallback((newSearchText) => {
        setSearchText(newSearchText);
    }, [setSearchText]);

    return (
        <div className={_cs(styles.organizationSelectInput, className)}>
            <SearchSelectInput
                {...otherProps}
                name=""
                value={value}
                onSearchValueChange={handleSearchInputChange}
                options={options}
                searchOptions={data?.organizationList?.results ?? []}
                keySelector={keySelector}
                labelSelector={labelSelector}
                onChange={handleOptionClick}
                optionsPending={loading}
                nonClearable
            />
        </div>
    );
}

export default OrganizationSelectInput;
