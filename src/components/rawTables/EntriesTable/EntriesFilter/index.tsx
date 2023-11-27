import React, { useMemo, useState, useCallback } from 'react';
import {
    TextInput,
    Button,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    PartialForm,
    PurgeNull,
    nullCondition,
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
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import ViolenceContextMultiSelectInput, { ViolenceContextOption } from '#components/selections/ViolenceContextMultiSelectInput';
import BooleanInput from '#components/selections/BooleanInput';
import {
    isFlowCategory,
    isVisibleCategory,
} from '#utils/selectionConstants';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    ExtractionEntryListFiltersQueryVariables,
    FigureOptionsForFiltersQuery,
    Figure_Category_Types as FigureCategoryTypes,
    Crisis_Type as CrisisType,
} from '#generated/types';

import styles from './styles.css';

// FIXME: the comparison should be type-safe but
// we are currently down-casting string literals to string
const conflict: CrisisType = 'CONFLICT';
const disaster: CrisisType = 'DISASTER';

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
        violenceList {
            results {
                id
                name
                subTypes {
                    results {
                        id
                        name
                    }
                }
            }
        }
        contextOfViolenceList {
            results {
              id
              name
            }
        }
        disasterCategoryList {
            results {
                id
                name
                subCategories {
                    results {
                        id
                        name
                        types {
                            results {
                                id
                                name
                                subTypes {
                                    results {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
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
    fields: (filterValue): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
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
            filterFigureCrises: [arrayCondition],
            filterFigureCrisisTypes: [arrayCondition],
            filterFigureHasExcerptIdu: [],
            filterFigureHasHousingDestruction: [],

            filterContextOfViolences: [nullCondition, arrayCondition],
            filterFigureDisasterSubTypes: [nullCondition, arrayCondition],
            filterFigureViolenceSubTypes: [nullCondition, arrayCondition],
        };
        if (filterValue?.filterFigureCrisisTypes?.includes(conflict)) {
            basicFields = {
                ...basicFields,
                filterFigureViolenceSubTypes: [arrayCondition],
                filterContextOfViolences: [],
            };
        }
        if (filterValue?.filterFigureCrisisTypes?.includes(disaster)) {
            basicFields = {
                ...basicFields,
                filterFigureDisasterSubTypes: [arrayCondition],
            };
        }
        return basicFields;
    },
};

interface ViolenceOption {
    violenceTypeId: string;
    violenceTypeName: string;
}
const violenceGroupKeySelector = (item: ViolenceOption) => (
    item.violenceTypeId
);
const violenceGroupLabelSelector = (item: ViolenceOption) => (
    item.violenceTypeName
);

interface DisasterOption {
    disasterTypeId: string;
    disasterTypeName: string;
    disasterSubCategoryId: string;
    disasterSubCategoryName: string;
    disasterCategoryId: string;
    disasterCategoryName: string;
}
const disasterGroupKeySelector = (item: DisasterOption) => (
    `${item.disasterCategoryId}-${item.disasterSubCategoryId}-${item.disasterTypeId}`
);
const disasterGroupLabelSelector = (item: DisasterOption) => (
    `${item.disasterCategoryName} › ${item.disasterSubCategoryName} › ${item.disasterTypeName}`
);

interface EntriesFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<ExtractionEntryListFiltersQueryVariables>) => void;
    disabled?: boolean;

    reviewStatusHidden?: boolean;
    countriesHidden?: boolean;
    eventsHidden?: boolean;
    crisesHidden?: boolean;

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
        crisesHidden,
    } = props;

    const [
        organizationOptions,
        setOrganizationOptions,
    ] = useState<OrganizationOption[] | undefined | null>();

    const [
        violenceContextOptions,
        setViolenceContextOptions,
    ] = useState<ViolenceContextOption[] | null | undefined>();

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

    const [
        crisisOptions,
        setCrisisOptions,
    ] = useState<CrisisOption[] | undefined | null>();

    const defaultFormValues: PartialForm<FormType> = useMemo(() => ({
        filterEntryArticleTitle: undefined,
        filterEntryPublishers: undefined,
        filterFigureSources: undefined,
        filterFigureReviewStatus: undefined,
        filterFigureCountries: defaultCountries,
        filterFigureEvents: defaultEvents,
        filterFigureCrises: defaultCrises,
        filterFigureTerms: undefined,
        filterFigureRoles: undefined,
        filterFigureCategoryTypes: undefined,
        filterFigureCategories: undefined,
        filterFigureHasExcerptIdu: undefined,
        filterFigureHasHousingDestruction: undefined,
    }), [
        defaultCountries,
        defaultEvents,
        defaultCrises,
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

    const violenceOptions = data?.violenceList?.results?.flatMap((violenceType) => (
        violenceType.subTypes?.results?.map((violenceSubType) => ({
            ...violenceSubType,
            violenceTypeId: violenceType.id,
            violenceTypeName: violenceType.name,
        }))
    )).filter(isDefined);

    // eslint-disable-next-line max-len
    const disasterSubTypeOptions = data?.disasterCategoryList?.results?.flatMap((disasterCategory) => (
        disasterCategory.subCategories?.results?.flatMap((disasterSubCategory) => (
            disasterSubCategory.types?.results?.flatMap((disasterType) => (
                disasterType.subTypes?.results?.map((disasterSubType) => ({
                    ...disasterSubType,
                    disasterTypeId: disasterType.id,
                    disasterTypeName: disasterType.name,
                    disasterSubCategoryId: disasterSubCategory.id,
                    disasterSubCategoryName: disasterSubCategory.name,
                    disasterCategoryId: disasterCategory.id,
                    disasterCategoryName: disasterCategory.name,
                }))
            ))
        ))
    )).filter(isDefined);

    const filterChanged = defaultFormValues !== value;

    const conflictType = value.filterFigureCrisisTypes?.includes(conflict);
    const disasterType = value.filterFigureCrisisTypes?.includes(disaster);

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
                {!crisesHidden && (
                    <CrisisMultiSelectInput
                        options={crisisOptions}
                        label="Crises"
                        name="filterFigureCrises"
                        error={error?.fields?.filterFigureCrises?.$internal}
                        value={value.filterFigureCrises}
                        onChange={onValueChange}
                        disabled={disabled}
                        onOptionsChange={setCrisisOptions}
                        defaultCountries={defaultCountries}
                        // countries={value.filterFigureCountries}
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
                {conflictType && (
                    <>
                        <MultiSelectInput
                            className={styles.input}
                            options={violenceOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Violence Types"
                            name="filterFigureViolenceSubTypes"
                            value={value.filterFigureViolenceSubTypes}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureViolenceSubTypes?.$internal}
                            groupLabelSelector={violenceGroupLabelSelector}
                            groupKeySelector={violenceGroupKeySelector}
                            grouped
                        />
                        <ViolenceContextMultiSelectInput
                            className={styles.input}
                            options={violenceContextOptions}
                            label="Context of Violence"
                            name="filterContextOfViolences"
                            value={value.filterContextOfViolences}
                            onChange={onValueChange}
                            onOptionsChange={setViolenceContextOptions}
                            error={error?.fields?.filterContextOfViolences?.$internal}
                        />
                    </>
                )}
                {disasterType && (
                    <MultiSelectInput
                        className={styles.input}
                        options={disasterSubTypeOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Hazard Types"
                        name="filterFigureDisasterSubTypes"
                        value={value.filterFigureDisasterSubTypes}
                        onChange={onValueChange}
                        error={error?.fields?.filterFigureDisasterSubTypes?.$internal}
                        groupLabelSelector={disasterGroupLabelSelector}
                        groupKeySelector={disasterGroupKeySelector}
                        grouped
                    />
                )}
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
