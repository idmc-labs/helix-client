import React, { useState, useCallback } from 'react';
import {
    TextInput,
    Button,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    PartialForm,
    PurgeNull,
    arrayCondition,
} from '@togglecorp/toggle-form';
import {
    IoSearchOutline,
} from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    ExtractionEntryListFiltersQueryVariables,
    FigureOptionsForFiltersQuery,
} from '#generated/types';
import styles from './styles.css';

const FIGURE_OPTIONS = gql`
    query FigureOptionsForFilters {
        figureReviewStatus: __type(name: "FIGURE_REVIEW_STATUS") {
            enumValues {
                name
                description
            }
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type EntriesFilterFields = Omit<ExtractionEntryListFiltersQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<EntriesFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterEntryArticleTitle: [],
        filterEntryPublishers: [arrayCondition],
        filterFigureSources: [arrayCondition],
        filterFigureReviewStatus: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    filterEntryArticleTitle: undefined,
    filterEntryPublishers: undefined,
    filterFigureSources: undefined,
    filterFigureReviewStatus: undefined,
};

interface EntriesFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<ExtractionEntryListFiltersQueryVariables>) => void;
    reviewStatusHidden?: boolean;
}

function EntriesFilter(props: EntriesFilterProps) {
    const {
        className,
        onFilterChange,
        reviewStatusHidden,
    } = props;

    const [
        organizationOptions,
        setOrganizationOptions,
    ] = useState<OrganizationOption[] | undefined | null>();

    const {
        data,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForFiltersQuery>(FIGURE_OPTIONS);

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

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
                    name="filterEntryArticleTitle"
                    value={value.filterEntryArticleTitle}
                    onChange={onValueChange}
                    placeholder="Search by entry title or code"
                />
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Publishers"
                    options={organizationOptions}
                    name="filterEntryPublishers"
                    onOptionsChange={setOrganizationOptions}
                    onChange={onValueChange}
                    value={value.filterEntryPublishers}
                    error={error?.fields?.filterEntryPublishers?.$internal}
                />
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Sources"
                    options={organizationOptions}
                    name="filterFigureSources"
                    onOptionsChange={setOrganizationOptions}
                    onChange={onValueChange}
                    value={value.filterFigureSources}
                    error={error?.fields?.filterFigureSources?.$internal}
                />
                <MultiSelectInput<FigureTerms, 'filterFigureTerms', NonNullable<TermOptions>[number], { containerClassName?: string }>
                    options={terms as TermOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Terms"
                    name="filterFigureTerms"
                    value={value.filterFigureTerms}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureTerms?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <MultiSelectInput<Role, 'filterFigureRoles', NonNullable<FigureRoleOptions>[number], { containerClassName?: string }>
                    options={figureRoles as FigureRoleOptions}
                    label="Roles"
                    name="filterFigureRoles"
                    value={value.filterFigureRoles}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureRoles?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <MultiSelectInput<string, 'filterFigureCategoryTypes', NonNullable<FigureCategoryTypeOptions>[number], { containerClassName?: string }>
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureCategoryTypes) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    options={categoryTypeOptions}
                    label="Category Types"
                    name="filterFigureCategoryTypes"
                    value={value.filterFigureCategoryTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureCategoryTypes?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <MultiSelectInput<FigureCategoryTypes, 'filterFigureCategories', NonNullable<FigureCategoryOptions>[number], { containerClassName?: string }>
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureCategories) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    options={figureCategories as FigureCategoryOptions}
                    label="Categories"
                    name="filterFigureCategories"
                    value={value.filterFigureCategories}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCategories?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    groupKeySelector={figureCategoryGroupKeySelector}
                    groupLabelSelector={figureCategoryGroupLabelSelector}
                    grouped
                    hideOptionFilter={figureCategoryHideOptionFilter}
                />
                {/* FIXME: hide this if country is already selected */}
                <CountryMultiSelectInput
                    options={countryOptions}
                    onOptionsChange={setCountries}
                    label="Countries"
                    name="filterFigureCountries"
                    value={value.filterFigureCountries}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCountries?.$internal}
                    disabled={disabled}
                />
                {/* FIXME: hide this if event is already selected */}
                <EventMultiSelectInput
                    label="Events"
                    options={eventOptions}
                    name="filterFigureEvents"
                    onOptionsChange={setEventOptions}
                    onChange={onValueChange}
                    value={value.filterFigureEvents}
                    error={error?.fields?.filterFigureEvents?.$internal}
                    disabled={disabled}
                />
                <MultiSelectInput<CrisisType, 'filterFigureCrisisTypes', NonNullable<CrisisTypeOptions>[number], { containerClassName?: string }>
                    options={data?.crisisType?.enumValues as CrisisTypeOptions}
                    label="Causes"
                    name="filterFigureCrisisTypes"
                    value={value.filterFigureCrisisTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureCrisisTypes?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                {!reviewStatusHidden && (
                    <MultiSelectInput
                        className={styles.input}
                        options={data?.figureReviewStatus?.enumValues}
                        label="Review Status"
                        name="filterFigureReviewStatus"
                        value={value.filterFigureReviewStatus}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        error={error?.fields?.filterFigureReviewStatus?.$internal}
                        disabled={figureOptionsLoading || !!figureOptionsError}
                    />
                )}
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset Filters"
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

export default EntriesFilter;
