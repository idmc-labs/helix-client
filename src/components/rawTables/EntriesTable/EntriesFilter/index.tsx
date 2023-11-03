import React, { useMemo, useState, useCallback } from 'react';
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
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import EventMultiSelectInput, { EventOption } from '#components/selections/EventMultiSelectInput';
import BooleanInput from '#components/selections/BooleanInput';
import {
    isFlowCategory,
    isVisibleCategory,
} from '#utils/selectionConstants';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    ExtractionEntryListFiltersQueryVariables,
    FigureOptionsForFiltersQuery,
    Figure_Category_Types as FigureCategoryTypes,
} from '#generated/types';

import styles from './styles.css';

const categoryTypeOptions = [
    { name: 'FLOW', description: 'Flow' },
    { name: 'STOCK', description: 'Stock' },
];

interface FigureCategory {
    name: FigureCategoryTypes;
    description: string;
}

const FIGURE_OPTIONS = gql`
    query FigureOptionsForFilters {
        figureReviewStatus: __type(name: "FIGURE_REVIEW_STATUS") {
            enumValues {
                name
                description
            }
        }
        figureTermList: __type(name: "FIGURE_TERMS") {
            enumValues {
                name
                description
            }
        }
        figureCategoryList: __type(name: "FIGURE_CATEGORY_TYPES") {
            enumValues {
                name
                description
            }
        }
        figureRoleList: __type(name: "ROLE") {
            enumValues {
                name
                description
            }
        }
        figureCrisisType: __type(name: "CRISIS_TYPE") {
            enumValues {
                name
                description
            }
        }
    }
`;

interface DisplacementTypeOption {
    name: FigureCategoryTypes;
    description?: string | null | undefined;
}

const figureCategoryGroupKeySelector = (item: DisplacementTypeOption) => (
    isFlowCategory(item.name) ? 'Flow' : 'Stock'
);

const figureCategoryGroupLabelSelector = (item: DisplacementTypeOption) => (
    isFlowCategory(item.name) ? 'Flow' : 'Stock'
);

const figureCategoryHideOptionFilter = (item: DisplacementTypeOption) => (
    isVisibleCategory(item.name)
);

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
        filterFigureCountries: [arrayCondition],
        filterFigureEvents: [arrayCondition],
        filterFigureTerms: [arrayCondition],
        filterFigureRoles: [arrayCondition],
        filterFigureCategoryTypes: [arrayCondition],
        filterFigureCategories: [arrayCondition],
        filterFigureCrisisTypes: [arrayCondition],
        filterFigureHasExcerptIdu: [],
        filterFigureHasHousingDestruction: [],
    }),
};

interface EntriesFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<ExtractionEntryListFiltersQueryVariables>) => void;
    disabled?: boolean;

    reviewStatusHidden?: boolean;
    countriesHidden?: boolean;
    eventsHidden?: boolean;

    defaultCountries?: string[];
    defaultCrises?: string[];
    defaultEvents?: string[];
}

function EntriesFilter(props: EntriesFilterProps) {
    const {
        className,
        onFilterChange,
        reviewStatusHidden,
        disabled,
        defaultCrises,
        defaultCountries,
        defaultEvents,
        countriesHidden,
        eventsHidden,
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

    const [
        countryOptions,
        setCountryOptions,
    ] = useState<CountryOption[] | undefined | null>();

    const [
        eventOptions,
        setEventOptions,
    ] = useState<EventOption[] | undefined | null>();

    const defaultFormValues: PartialForm<FormType> = useMemo(() => ({
        filterEntryArticleTitle: undefined,
        filterEntryPublishers: undefined,
        filterFigureSources: undefined,
        filterFigureReviewStatus: undefined,
        filterFigureCountries: defaultCountries,
        filterFigureEvents: defaultEvents,
        filterFigureTerms: undefined,
        filterFigureRoles: undefined,
        filterFigureCategoryTypes: undefined,
        filterFigureCategories: undefined,
        filterFigureHasExcerptIdu: undefined,
        filterFigureHasHousingDestruction: undefined,
    }), [
        defaultCountries,
        defaultEvents,
    ]);

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
        [
            onValueSet,
            onFilterChange,
            defaultFormValues,
        ],
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
                <MultiSelectInput
                    options={data?.figureTermList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Terms"
                    name="filterFigureTerms"
                    value={value.filterFigureTerms}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureTerms?.$internal}
                    disabled={disabled}
                />
                <MultiSelectInput
                    options={data?.figureRoleList?.enumValues}
                    label="Roles"
                    name="filterFigureRoles"
                    value={value.filterFigureRoles}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureRoles?.$internal}
                    disabled={disabled}
                />
                <MultiSelectInput
                    options={categoryTypeOptions}
                    label="Category Types"
                    name="filterFigureCategoryTypes"
                    value={value.filterFigureCategoryTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureCategoryTypes?.$internal}
                    disabled={disabled}
                />
                <MultiSelectInput
                    options={data?.figureCategoryList?.enumValues as FigureCategory[]}
                    label="Categories"
                    name="filterFigureCategories"
                    value={value.filterFigureCategories}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCategories?.$internal}
                    disabled={disabled}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    groupKeySelector={figureCategoryGroupKeySelector}
                    groupLabelSelector={figureCategoryGroupLabelSelector}
                    grouped
                    hideOptionFilter={figureCategoryHideOptionFilter}
                />
                {!countriesHidden && (
                    <CountryMultiSelectInput
                        options={countryOptions}
                        onOptionsChange={setCountryOptions}
                        label="Countries"
                        name="filterFigureCountries"
                        value={value.filterFigureCountries}
                        onChange={onValueChange}
                        error={error?.fields?.filterFigureCountries?.$internal}
                        disabled={disabled}
                        // defaultCountries={defaultCountries}
                        defaultCrises={defaultCrises}
                        defaultEvents={defaultEvents}
                    />
                )}
                {!eventsHidden && (
                    <EventMultiSelectInput
                        label="Events"
                        options={eventOptions}
                        name="filterFigureEvents"
                        onOptionsChange={setEventOptions}
                        onChange={onValueChange}
                        value={value.filterFigureEvents}
                        error={error?.fields?.filterFigureEvents?.$internal}
                        disabled={disabled}
                        defaultCountries={defaultCountries}
                        defaultCrises={defaultCrises}
                    />
                )}
                <MultiSelectInput
                    options={data?.figureCrisisType?.enumValues}
                    label="Causes"
                    name="filterFigureCrisisTypes"
                    value={value.filterFigureCrisisTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureCrisisTypes?.$internal}
                    disabled={disabled}
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
                <BooleanInput
                    label="Has Excerpt IDU"
                    name="filterFigureHasExcerptIdu"
                    value={value.filterFigureHasExcerptIdu}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureHasExcerptIdu}
                    disabled={disabled}
                />
                <BooleanInput
                    label="Has Housing Destruction"
                    name="filterFigureHasHousingDestruction"
                    value={value.filterFigureHasHousingDestruction}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureHasHousingDestruction}
                    disabled={disabled}
                />
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
