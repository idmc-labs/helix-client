import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
} from '@togglecorp/toggle-form';
import {
    IoIosSearch,
} from 'react-icons/io';

import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import NonFieldError from '#components/NonFieldError';

import { PartialForm, PurgeNull } from '#types';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import { OrganizationsListQueryVariables, OrganizationTypeListQuery } from '#generated/types';
import styles from './styles.css';

const GET_ORGANIZATION_TYPE_LIST = gql`
    query OrganizationTypeList {
        organizationKindList {
            results {
                id
                name
            }
        }
        organizationCategoryList: __type(name: "ORGANIZATION_CATEGORY") {
            enumValues {
                name
                description
            }
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type OrganizationFilterFields = Omit<OrganizationsListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<OrganizationFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        name_Unaccent_Icontains: [],
        shortName_Unaccent_Icontains: [],
        organizationTypes: [],
        countries: [],
        categories: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    name_Unaccent_Icontains: undefined,
    shortName_Unaccent_Icontains: undefined,
    organizationTypes: [],
    countries: [],
    categories: [],
};

interface OrganizationFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<OrganizationsListQueryVariables>) => void;
}

function OrganizationFilter(props: OrganizationFilterProps) {
    const {
        className,
        onFilterChange,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const [
        filterCountries,
        setFilterCountries,
    ] = useState<CountryOption[] | null | undefined>();

    const {
        data: organizationKinds,
        loading: organizationListLoading,
    } = useQuery<OrganizationTypeListQuery>(GET_ORGANIZATION_TYPE_LIST);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

    const organizationTypesList = organizationKinds?.organizationKindList?.results;
    const organizationCategoryList = organizationKinds?.organizationCategoryList?.enumValues;
    const filterChanged = defaultFormValues !== value;

    return (
        <form
            className={_cs(className, styles.queryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.contentContainer}>
                <TextInput
                    className={styles.input}
                    icons={<IoIosSearch />}
                    label="Search Name"
                    name="name_Unaccent_Icontains"
                    value={value.name_Unaccent_Icontains}
                    onChange={onValueChange}
                    error={error?.fields?.name_Unaccent_Icontains}
                />
                <TextInput
                    className={styles.input}
                    icons={<IoIosSearch />}
                    label="ShortName"
                    name="shortName_Unaccent_Icontains"
                    value={value.shortName_Unaccent_Icontains}
                    onChange={onValueChange}
                    error={error?.fields?.shortName_Unaccent_Icontains}
                />
                <MultiSelectInput
                    className={styles.input}
                    label="Geographical Coverage"
                    name="categories"
                    options={organizationCategoryList}
                    value={value.categories}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    disabled={organizationListLoading}
                    error={error?.fields?.categories?.$internal}
                />
                <CountryMultiSelectInput
                    className={styles.input}
                    options={filterCountries}
                    onOptionsChange={setFilterCountries}
                    label="Countries"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries?.$internal}
                />
                <MultiSelectInput
                    className={styles.input}
                    label="Organization Type"
                    name="organizationTypes"
                    options={organizationTypesList}
                    value={value.organizationTypes}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    onChange={onValueChange}
                    disabled={organizationListLoading}
                    error={error?.fields?.organizationTypes?.$internal}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset"
                        disabled={!filterChanged}
                        className={styles.button}
                    >
                        Reset
                    </Button>
                    <Button
                        name={undefined}
                        type="submit"
                        title="Apply"
                        disabled={pristine}
                        className={styles.button}
                        variant="primary"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default OrganizationFilter;
