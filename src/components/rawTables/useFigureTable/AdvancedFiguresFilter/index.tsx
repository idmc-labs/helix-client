import React, { useCallback, useEffect } from 'react';
import {
    DateRangeDualInput,
    TextInput,
    Button,
    MultiSelectInput,
    Switch,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    PartialForm,
    PurgeNull,
    arrayCondition,
    useForm,
    ObjectSchema,
    createSubmitHandler,
} from '@togglecorp/toggle-form';
import { IoSearchOutline } from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';

import OrganizationMultiSelectInput from '#components/selections/OrganizationMultiSelectInput';
import RegionMultiSelectInput from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput from '#components/selections/GeographicMultiSelectInput';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput from '#components/selections/CrisisMultiSelectInput';
import FigureTagMultiSelectInput from '#components/selections/FigureTagMultiSelectInput';
import UserMultiSelectInput from '#components/selections/UserMultiSelectInput';
import EventMultiSelectInput from '#components/selections/EventMultiSelectInput';
import ViolenceContextMultiSelectInput from '#components/selections/ViolenceContextMultiSelectInput';

import Container from '#components/Container';
import NonFieldError from '#components/NonFieldError';
import Row from '#components/Row';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
    hasNoData,
    GetEnumOptions,
} from '#utils/common';
import {
    isFlowCategory,
    isVisibleCategory,
} from '#utils/selectionConstants';
import useBooleanState from '#utils/useBooleanState';
import {
    ExtractionFormOptionsQuery,
    ExtractionEntryListFiltersQueryVariables,
    Figure_Category_Types as FigureCategoryTypes,
    Crisis_Type as CrisisType,
} from '#generated/types';
import styles from './styles.css';
import BooleanInput from '#components/selections/BooleanInput';

const categoryTypeOptions = [
    { name: 'FLOW', description: 'Flow' },
    { name: 'STOCK', description: 'Stock' },
];

const FORM_OPTIONS = gql`
    query ExtractionFormOptions {
        figureCategoryList: __type(name: "FIGURE_CATEGORY_TYPES") {
            name
            enumValues {
                name
                description
            }
        }
        figureTermList: __type(name: "FIGURE_TERMS") {
            name
            enumValues {
                name
                description
            }
        }
        figureRoleList: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        figureReviewStatus: __type(name: "FIGURE_REVIEW_STATUS") {
            name
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

// NOTE: the comparison should be type-safe but
// we are currently down-casting string literals to string
const conflict: CrisisType = 'CONFLICT';
const disaster: CrisisType = 'DISASTER';

interface DisplacementTypeOption {
    // name: FigureCategoryTypes;
    name: string;
    description?: string | null | undefined;
}
const figureCategoryGroupKeySelector = (item: DisplacementTypeOption) => (
    isFlowCategory(item.name as FigureCategoryTypes) ? 'Flow' : 'Stock'
);

const figureCategoryGroupLabelSelector = (item: DisplacementTypeOption) => (
    isFlowCategory(item.name as FigureCategoryTypes) ? 'Flow' : 'Stock'
);

const figureCategoryHideOptionFilter = (item: DisplacementTypeOption) => (
    isVisibleCategory(item.name as FigureCategoryTypes)
);

type AdvancedFigureFiltersFields = NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<
    AdvancedFigureFiltersFields
>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;
const schema: FormSchema = {
    fields: (filterValue): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
            filterFigureRegions: [arrayCondition],
            filterFigureCountries: [arrayCondition],
            filterFigureCrises: [arrayCondition],
            filterFigureCrisisTypes: [arrayCondition],
            filterFigureTags: [arrayCondition],
            filterEntryArticleTitle: [],

            filterFigureRoles: [arrayCondition],
            filterFigureTerms: [arrayCondition],
            filterFigureStartAfter: [],
            filterFigureEndBefore: [],
            filterFigureCategories: [arrayCondition],
            filterFigureCategoryTypes: [],
            filterFigureGeographicalGroups: [arrayCondition],
            filterEntryPublishers: [arrayCondition],
            filterFigureSources: [arrayCondition],
            filterFigureHasDisaggregatedData: [],
            filterFigureCreatedBy: [arrayCondition],
            filterFigureEvents: [arrayCondition],
            filterFigureReviewStatus: [arrayCondition],
            filterFigureHasExcerptIdu: [],
            filterFigureHasHousingDestruction: [],
        };
        if (filterValue?.filterFigureCrisisTypes?.includes(conflict)) {
            basicFields = {
                ...basicFields,
                filterFigureViolenceSubTypes: [arrayCondition],
                filterFigureContextOfViolence: [],
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

// TODO: move fetching extraction query outside this component
interface AdvancedFigureFiltersProps {
    className?: string;
    currentFilter: PartialForm<FormType>,
    initialFilter: PartialForm<FormType>,
    onFilterChange: (value: PartialForm<FormType>) => void;
    disabled: boolean;
    //
    // NOTE: We have not implemented createdBy
    hiddenFields?: ('event' | 'crisis' | 'country' | 'reviewStatus' | 'createdBy')[];

    // We use these props to filter out other options
    countries?: string[];
    crises?: string[];
    events?: string[];
}

function AdvancedFigureFilters(props: AdvancedFigureFiltersProps) {
    const {
        disabled,
        className,
        initialFilter,
        currentFilter,
        onFilterChange,
        countries,
        crises,
        events,
        hiddenFields = [],
    } = props;

    const [
        filtersExpanded, , , ,
        toggleFiltersExpansion,
    ] = useBooleanState(false);

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(currentFilter, schema);
    // NOTE: Set the form value when initialFilter and currentFilter is changed on parent
    // We cannot only use initialFilter as it will change the form value when
    // currentFilter != initialFilter on mount
    useEffect(
        () => {
            if (initialFilter === currentFilter) {
                onValueSet(initialFilter);
            }
        },
        [currentFilter, initialFilter, onValueSet],
    );

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFilter);
            onFilterChange(initialFilter);
        },
        [onValueSet, onFilterChange, initialFilter],
    );

    const {
        data,
        loading: queryOptionsLoading,
        error: queryOptionsError,
    } = useQuery<ExtractionFormOptionsQuery>(FORM_OPTIONS);

    const handleSubmit = useCallback((finalValues: FormType) => {
        onFilterChange(finalValues);
        onPristineSet(true);
    }, [onFilterChange, onPristineSet]);

    const crisisTypes = data?.crisisType?.enumValues;
    type CrisisTypeOptions = GetEnumOptions<
        typeof crisisTypes,
        NonNullable<typeof value.filterFigureCrisisTypes>[number]
    >;

    const terms = data?.figureTermList?.enumValues;
    type TermOptions = GetEnumOptions<
        typeof terms,
        NonNullable<typeof value.filterFigureTerms>[number]
    >;

    const figureRoles = data?.figureRoleList?.enumValues;
    type FigureRoleOptions = GetEnumOptions<
        typeof figureRoles,
        NonNullable<typeof value.filterFigureRoles>[number]
    >;

    const figureCategories = data?.figureCategoryList?.enumValues;
    type FigureCategoryOptions = GetEnumOptions<
        typeof figureCategories,
        NonNullable<typeof value.filterFigureCategories>[number]
    >;

    const reviewStatusOptions = data?.figureReviewStatus?.enumValues;
    type ReviewStatusOptions = GetEnumOptions<
        typeof reviewStatusOptions,
        NonNullable<typeof value.filterFigureReviewStatus>[number]
    >;

    type FigureCategoryTypeOptions = typeof categoryTypeOptions;

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

    const filterChanged = initialFilter !== value;

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
            <TextInput
                icons={<IoSearchOutline />}
                label="Search"
                placeholder="Search by entry title or code"
                name="filterEntryArticleTitle"
                value={value.filterEntryArticleTitle}
                onChange={onValueChange}
                error={error?.fields?.filterEntryArticleTitle}
                disabled={disabled}
            />
            <div className={styles.columnContainer}>
                <div className={styles.column}>
                    <div className={_cs(styles.label)}>
                        Displacement classification
                    </div>
                    <MultiSelectInput
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
                    {!hiddenFields.includes('crisis') && (
                        <CrisisMultiSelectInput
                            label="Crises"
                            name="filterFigureCrises"
                            error={error?.fields?.filterFigureCrises?.$internal}
                            value={value.filterFigureCrises}
                            onChange={onValueChange}
                            disabled={disabled}
                            countries={countries}
                        />
                    )}
                    {!hiddenFields.includes('event') && (
                        <EventMultiSelectInput
                            label="Events"
                            name="filterFigureEvents"
                            onChange={onValueChange}
                            value={value.filterFigureEvents}
                            error={error?.fields?.filterFigureEvents?.$internal}
                            disabled={disabled}
                            countries={countries}
                            crises={crises}
                        />
                    )}
                </div>
                <div className={styles.column}>
                    <div className={_cs(styles.label)}>
                        Data Filters
                    </div>
                    <MultiSelectInput
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
                    <MultiSelectInput
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
                    <DateRangeDualInput
                        label="Date Range"
                        fromName="filterFigureStartAfter"
                        fromValue={value.filterFigureStartAfter}
                        fromOnChange={onValueChange}
                        fromError={error?.fields?.filterFigureStartAfter}
                        toName="filterFigureEndBefore"
                        toValue={value.filterFigureEndBefore}
                        toOnChange={onValueChange}
                        toError={error?.fields?.filterFigureEndBefore}
                    />
                </div>
                {!hiddenFields.includes('country') && (
                    <div className={styles.column}>
                        <div className={_cs(styles.label)}>
                            Geospatial Filters
                        </div>
                        <CountryMultiSelectInput
                            label="Countries"
                            name="filterFigureCountries"
                            value={value.filterFigureCountries}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureCountries?.$internal}
                            disabled={disabled}
                            crises={crises}
                            events={events}
                        />
                        <RegionMultiSelectInput
                            label="Regions"
                            name="filterFigureRegions"
                            value={value.filterFigureRegions}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureRegions?.$internal}
                            disabled={disabled}
                        />
                        <GeographicMultiSelectInput
                            label="Geographic Regions"
                            name="filterFigureGeographicalGroups"
                            value={value.filterFigureGeographicalGroups}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureGeographicalGroups?.$internal}
                            disabled={disabled}
                        />
                    </div>
                )}
            </div>
            <Switch
                label="Additional Filters"
                name="showAdditionalFilters"
                value={filtersExpanded}
                onChange={toggleFiltersExpansion}
            />
            <div
                className={_cs(
                    styles.label,
                    !filtersExpanded && styles.hidden,
                )}
            >
                Additional Filters
            </div>
            {(conflictType || disasterType) && (
                <Row
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureViolenceSubTypes)
                            && hasNoData(value.filterFigureContextOfViolence)
                            && hasNoData(value.filterFigureDisasterSubTypes)
                            && !filtersExpanded)
                        && styles.hidden,
                    )}
                >
                    {conflictType && (
                        <>
                            <MultiSelectInput
                                className={_cs(
                                    styles.input,
                                    // eslint-disable-next-line max-len
                                    (hasNoData(value.filterFigureViolenceSubTypes) && !filtersExpanded)
                                    && styles.hidden,
                                )}
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
                                className={_cs(
                                    styles.input,
                                    // eslint-disable-next-line max-len
                                    (hasNoData(value.filterFigureContextOfViolence) && !filtersExpanded)
                                    && styles.hidden,
                                )}
                                label="Context of Violence"
                                name="filterFigureContextOfViolence"
                                value={value.filterFigureContextOfViolence}
                                onChange={onValueChange}
                                error={error?.fields?.filterFigureContextOfViolence?.$internal}
                            />
                        </>
                    )}
                    {disasterType && (
                        <MultiSelectInput
                            className={_cs(
                                styles.input,
                                // eslint-disable-next-line max-len
                                (hasNoData(value.filterFigureDisasterSubTypes) && !filtersExpanded)
                                && styles.hidden,
                            )}
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
                </Row>
            )}
            <Row
                className={_cs(
                    styles.input,
                    (hasNoData(value.filterFigureCreatedBy)
                        && hasNoData(value.filterEntryPublishers)
                        && hasNoData(value.filterFigureSources)
                        && hasNoData(value.filterFigureReviewStatus)
                        && !filtersExpanded)
                    && styles.hidden,
                )}
            >
                <UserMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureCreatedBy) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    label="Created By"
                    name="filterFigureCreatedBy"
                    value={value.filterFigureCreatedBy}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCreatedBy?.$internal}
                    disabled={disabled}
                />
                <OrganizationMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterEntryPublishers) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    label="Publishers"
                    name="filterEntryPublishers"
                    onChange={onValueChange}
                    value={value.filterEntryPublishers}
                    error={error?.fields?.filterEntryPublishers?.$internal}
                    disabled={disabled}
                />
                <OrganizationMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureSources) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    label="Sources"
                    name="filterFigureSources"
                    onChange={onValueChange}
                    value={value.filterFigureSources}
                    error={error?.fields?.filterFigureSources?.$internal}
                    disabled={disabled}
                />
                {!hiddenFields.includes('reviewStatus') && (
                    <MultiSelectInput
                        className={styles.input}
                        options={reviewStatusOptions as ReviewStatusOptions}
                        label="Review Status"
                        name="filterFigureReviewStatus"
                        value={value.filterFigureReviewStatus}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        error={error?.fields?.filterFigureReviewStatus?.$internal}
                        disabled={disabled}
                    />
                )}
            </Row>
            <Row
                className={_cs(
                    styles.input,
                    (hasNoData(value.filterFigureCategoryTypes)
                        && hasNoData(value.filterFigureCategories)
                        && hasNoData(value.filterFigureTags)
                        && hasNoData(value.filterFigureHasDisaggregatedData)
                        && !filtersExpanded)
                    && styles.hidden,
                )}
            >
                <FigureTagMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureTags) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    label="Tags"
                    name="filterFigureTags"
                    error={error?.fields?.filterFigureTags?.$internal}
                    value={value.filterFigureTags}
                    onChange={onValueChange}
                    disabled={disabled}
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
                <MultiSelectInput
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
                <BooleanInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureHasDisaggregatedData) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    label="Has Disaggregated Data"
                    name="filterFigureHasDisaggregatedData"
                    value={value.filterFigureHasDisaggregatedData}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureHasDisaggregatedData}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
            </Row>
            <Row
                className={_cs(
                    styles.input,
                    (hasNoData(value.filterFigureHasExcerptIdu)
                        && hasNoData(value.filterFigureHasHousingDestruction)
                        && !filtersExpanded)
                    && styles.hidden,
                )}
            >
                <BooleanInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureHasExcerptIdu) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    label="Has Excerpt IDU"
                    name="filterFigureHasExcerptIdu"
                    value={value.filterFigureHasExcerptIdu}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureHasExcerptIdu}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <BooleanInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureHasHousingDestruction) && !filtersExpanded)
                        && styles.hidden,
                    )}
                    label="Has Housing Destruction"
                    name="filterFigureHasHousingDestruction"
                    value={value.filterFigureHasHousingDestruction}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureHasHousingDestruction}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
            </Row>
            <Row singleColumnNoGrow>
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
                    disabled={disabled || pristine}
                    variant="primary"
                >
                    Apply
                </Button>
            </Row>
        </form>
    );
}

export default AdvancedFigureFilters;
