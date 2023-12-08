import React, { useCallback } from 'react';
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
    arrayCondition,
} from '@togglecorp/toggle-form';
import {
    IoSearchOutline,
} from 'react-icons/io5';

import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import NonFieldError from '#components/NonFieldError';

import { PartialForm, PurgeNull } from '#types';
import {
    OrganizationsListQueryVariables,
    OrganizationOptionsQuery,
} from '#generated/types';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import styles from './styles.css';

const GET_ORGANIZATION_OPTIONS = gql`
    query OrganizationOptions {
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
        name: [],
        countries: [arrayCondition],
        organizationKinds: [arrayCondition],
        categories: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    name: undefined,
    countries: [],
    organizationKinds: [],
    categories: [],
};

interface OrganizationFilterProps {
    className?: string;
    initialFilter?: PartialForm<FormType>;
    onFilterChange: (value: PurgeNull<OrganizationsListQueryVariables>) => void;
}

function OrganizationFilter(props: OrganizationFilterProps) {
    const {
        className,
        initialFilter,
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
    } = useForm(initialFilter ?? defaultFormValues, schema);

    const {
        data: organizationOptions,
        loading: organizationOptionsLoading,
        error: organizationOptionsError,
    } = useQuery<OrganizationOptionsQuery>(GET_ORGANIZATION_OPTIONS);

    const organizationKindList = organizationOptions?.organizationKindList?.results;
    const organizationCategoryList = organizationOptions?.organizationCategoryList?.enumValues;

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

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
                    icons={<IoSearchOutline />}
                    label="Search"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                />
                <CountryMultiSelectInput
                    className={styles.input}
                    label="Countries"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries?.$internal}
                />
                <MultiSelectInput
                    className={styles.input}
                    label="Organization Types"
                    name="organizationKinds"
                    options={organizationKindList}
                    value={value.organizationKinds}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.organizationKinds?.$internal}
                    disabled={organizationOptionsLoading || !!organizationOptionsError}
                />
                <MultiSelectInput
                    className={styles.input}
                    label="Geographical Coverages"
                    name="categories"
                    options={organizationCategoryList}
                    value={value.categories}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.categories?.$internal}
                    disabled={organizationOptionsLoading || !!organizationOptionsError}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset"
                        disabled={!filterChanged}
                    >
                        Reset
                    </Button>
                    <Button
                        name={undefined}
                        type="submit"
                        title="Apply"
                        disabled={pristine}
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
