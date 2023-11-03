import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
    DateRangeDualInput,
    TextInput,
    Button,
    MultiSelectInput,
    Switch,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    PartialForm,
    PurgeNull,
    arrayCondition,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
} from '@togglecorp/toggle-form';
import { IoSearchOutline } from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';

import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput, { GeographicOption } from '#components/selections/GeographicMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';
import EventMultiSelectInput, { EventOption } from '#components/selections/EventMultiSelectInput';

import Container from '#components/Container';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import Row from '#components/Row';

import {
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
    ExtractionForFormQuery,
    ExtractionForFormQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
    CreateExtractionMutationVariables,
    Figure_Category_Types as FigureCategoryTypes,
    Figure_Terms as FigureTerms,
    Crisis_Type as CrisisType,
    Figure_Review_Status as FigureReviewStatus,
    Role,
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
    }
`;
const EXTRACTION_FILTER = gql`
    query ExtractionForForm($id: ID!) {
        extractionQuery(id: $id) {
            filterFigureCountries {
                id
                idmcShortName
            }
            filterFigureCrises {
                id
                name
            }
            filterFigureStartAfter
            filterFigureEndBefore
            filterFigureCategories
            filterFigureTags {
                id
                name
            }
            filterFigureRoles
            id
            name
            filterFigureRegions {
                id
                name
            }
            filterFigureGeographicalGroups {
                id
                name
            }
            filterFigureSources {
                id
                name
                countries {
                    id
                    idmcShortName
                }
            }
            filterEntryPublishers {
                id
                name
                countries {
                    id
                    idmcShortName
                }
            }
            filterEntryArticleTitle
            filterFigureCrisisTypes
            filterFigureHasDisaggregatedData
            filterFigureEvents {
                id
                name
            }
            filterCreatedBy {
                id
                fullName
                isActive
            }
            filterFigureTerms
            createdAt
            createdBy {
                fullName
                id
            }
            filterFigureReviewStatus
            filterFigureHasExcerptIdu
            filterFigureHasHousingDestruction
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

// NOTE: should have used ExtractionEntryListFiltersQueryVariables instead of
// CreateExtractionMutationVariables['extraction'] but the type is looser
// eslint-disable-next-line @typescript-eslint/ban-types
type ExtractionFiltersFields = CreateExtractionMutationVariables['extraction'];
type FormType = PurgeNull<PartialForm<
    ExtractionFiltersFields
>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;
const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
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
        filterCreatedBy: [arrayCondition],
        filterFigureEvents: [arrayCondition],
        filterFigureReviewStatus: [arrayCondition],
        filterFigureHasExcerptIdu: [],
        filterFigureHasHousingDestruction: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    filterFigureRegions: [],
    filterFigureCountries: [],
    filterFigureCrises: [],
    filterFigureCategories: [],
    filterFigureCategoryTypes: undefined,
    filterFigureTags: [],
    filterFigureRoles: [],
    filterFigureGeographicalGroups: [],
    filterEntryPublishers: [],
    filterFigureSources: [],
    filterFigureTerms: [],
    filterCreatedBy: [],
    filterFigureEvents: [],
    filterFigureReviewStatus: [],
    filterFigureHasExcerptIdu: undefined,
    filterFigureHasHousingDestruction: undefined,
};

interface ExtractionFiltersProps {
    id?: string;
    className?: string;
    onFilterChange: React.Dispatch<React.SetStateAction<
        ExtractionEntryListFiltersQueryVariables | undefined
    >>;
    onFilterMetaChange: React.Dispatch<React.SetStateAction<
        { name?: string, id?: string }
    >>;
}

function ExtractionFilters(props: ExtractionFiltersProps) {
    const {
        id,
        className,
        onFilterChange,
        onFilterMetaChange,
    } = props;

    const [
        countryOptions,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        createdByOptions,
        setCreatedByOptions,
    ] = useState<UserOption[] | null | undefined>();
    const [
        regionOptions,
        setRegions,
    ] = useState<RegionOption[] | null | undefined>();
    const [
        geographicGroupOptions,
        setGeographicGroups,
    ] = useState<GeographicOption[] | null | undefined>();
    const [
        crisisOptions,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>();
    const [
        tagOptions,
        setTags,
    ] = useState<FigureTagOption[] | null | undefined>();
    const [
        sourceOptions,
        setSources,
    ] = useState<OrganizationOption[] | undefined | null>();
    const [
        publisherOptions,
        setPublishers,
    ] = useState<OrganizationOption[] | undefined | null>();
    const [
        eventOptions,
        setEventOptions,
    ] = useState<EventOption[] | undefined | null>();

    const [
        filtersExpanded, , , ,
        toggleFiltersExpansion,
    ] = useBooleanState(false);

    const [initialFormValues, setInitialFormValues] = useState<FormType>(
        defaultFormValues,
    );

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const { notify } = useContext(NotificationContext);

    const onFormValueSet = useCallback(
        (formValue: FormType) => {
            onValueSet(formValue);
            setInitialFormValues(formValue);
        },
        [onValueSet, setInitialFormValues],
    );

    const extractionVariables = useMemo(
        (): ExtractionForFormQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: extractionQueryLoading,
        error: extractionDataError,
    } = useQuery<ExtractionForFormQuery, ExtractionForFormQueryVariables>(
        EXTRACTION_FILTER,
        {
            skip: !extractionVariables,
            variables: extractionVariables,
            onCompleted: (response) => {
                const { extractionQuery: extraction } = response;
                if (!extraction) {
                    return;
                }
                const {
                    id: extractionId,
                    name: extractionName,
                    ...otherAttrs
                } = extraction;

                if (otherAttrs.filterFigureRegions) {
                    setRegions(otherAttrs.filterFigureRegions);
                }
                if (otherAttrs.filterFigureGeographicalGroups) {
                    setGeographicGroups(otherAttrs.filterFigureGeographicalGroups);
                }
                if (otherAttrs.filterFigureCountries) {
                    setCountries(otherAttrs.filterFigureCountries);
                }
                if (otherAttrs.filterFigureCrises) {
                    setCrises(otherAttrs.filterFigureCrises);
                }
                if (otherAttrs.filterFigureTags) {
                    setTags(otherAttrs.filterFigureTags);
                }
                if (otherAttrs.filterFigureSources) {
                    setSources(otherAttrs.filterFigureSources);
                }
                if (otherAttrs.filterEntryPublishers) {
                    setPublishers(otherAttrs.filterEntryPublishers);
                }
                if (otherAttrs.filterFigureEvents) {
                    setEventOptions(otherAttrs.filterFigureEvents);
                }
                if (otherAttrs.filterCreatedBy) {
                    setCreatedByOptions(otherAttrs.filterCreatedBy);
                }
                const formValue = removeNull({
                    filterFigureRegions: otherAttrs.filterFigureRegions?.map((r) => r.id),
                    filterFigureGeographicalGroups: otherAttrs.filterFigureGeographicalGroups
                        ?.map((r) => r.id),
                    filterCreatedBy: otherAttrs.filterCreatedBy?.map((u) => u.id),
                    filterFigureCountries: otherAttrs.filterFigureCountries?.map((c) => c.id),
                    filterFigureCrises: otherAttrs.filterFigureCrises?.map((cr) => cr.id),
                    filterFigureCategories: otherAttrs.filterFigureCategories,
                    filterFigureCategoryTypes: otherAttrs.filterFigureCategories,
                    filterFigureTags: otherAttrs.filterFigureTags?.map((ft) => ft.id),
                    filterFigureTerms: otherAttrs.filterFigureTerms,
                    filterFigureRoles: otherAttrs.filterFigureRoles,
                    filterFigureStartAfter: otherAttrs.filterFigureStartAfter,
                    filterFigureEndBefore: otherAttrs.filterFigureEndBefore,
                    filterEntryArticleTitle: otherAttrs.filterEntryArticleTitle,
                    filterFigureCrisisTypes: otherAttrs.filterFigureCrisisTypes,
                    filterEntryPublishers: otherAttrs.filterEntryPublishers?.map((fp) => fp.id),
                    filterFigureSources: otherAttrs.filterFigureSources?.map((fp) => fp.id),
                    filterFigureEvents: otherAttrs.filterFigureEvents?.map((e) => e.id),
                    filterFigureReviewStatus: otherAttrs.filterFigureReviewStatus,
                    filterFigureHasDisaggregatedData: otherAttrs.filterFigureHasDisaggregatedData,
                    filterFigureHasHousingDestruction: otherAttrs.filterFigureHasHousingDestruction,
                    filterFigureHasExcerptIdu: otherAttrs.filterFigureHasExcerptIdu,
                });
                onFormValueSet(formValue);
                onFilterChange(formValue);
                onFilterMetaChange({
                    id: extractionId,
                    name: extractionName,
                });
            },
        },
    );

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFormValues);
            onFilterChange(initialFormValues);
            notify({
                children: id
                    ? 'Filters reset successfully'
                    : 'Filters cleared successfully.',
                variant: 'success',
            });
        },
        [onValueSet, notify, id, initialFormValues, onFilterChange],
    );

    const {
        data,
        loading: queryOptionsLoading,
        error: queryOptionsError,
    } = useQuery<ExtractionFormOptionsQuery>(FORM_OPTIONS);

    const handleSubmit = React.useCallback((finalValues: FormType) => {
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

    const loading = extractionQueryLoading;
    const errored = !!extractionDataError;
    const disabled = loading || errored;

    const filterChanged = initialFormValues !== value;

    return (
        <form
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <Container
                contentClassName={_cs(className, styles.queryForm)}
                footerActions={(
                    <>
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
                    </>
                )}
            >
                {loading && <Loading absolute />}
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
                        <CrisisMultiSelectInput
                            options={crisisOptions}
                            label="Crises"
                            name="filterFigureCrises"
                            error={error?.fields?.filterFigureCrises?.$internal}
                            value={value.filterFigureCrises}
                            onChange={onValueChange}
                            disabled={disabled}
                            onOptionsChange={setCrises}
                            // countries={value.filterFigureCountries}
                        />
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
                    </div>
                    <div className={styles.column}>
                        <div className={_cs(styles.label)}>
                            Data Filters
                        </div>
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
                    <div className={styles.column}>
                        <div className={_cs(styles.label)}>
                            Geospatial Filters
                        </div>
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
                        <RegionMultiSelectInput
                            options={regionOptions}
                            onOptionsChange={setRegions}
                            label="Regions"
                            name="filterFigureRegions"
                            value={value.filterFigureRegions}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureRegions?.$internal}
                            disabled={disabled}
                        />
                        <GeographicMultiSelectInput
                            options={geographicGroupOptions}
                            onOptionsChange={setGeographicGroups}
                            label="Geographic Regions"
                            name="filterFigureGeographicalGroups"
                            value={value.filterFigureGeographicalGroups}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureGeographicalGroups?.$internal}
                            disabled={disabled}
                        />
                    </div>
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
                <Row
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterCreatedBy)
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
                            (hasNoData(value.filterCreatedBy) && !filtersExpanded)
                            && styles.hidden,
                        )}
                        options={createdByOptions}
                        label="Created By"
                        name="filterCreatedBy"
                        value={value.filterCreatedBy}
                        onChange={onValueChange}
                        onOptionsChange={setCreatedByOptions}
                        error={error?.fields?.filterCreatedBy?.$internal}
                        disabled={disabled}
                    />
                    <OrganizationMultiSelectInput
                        className={_cs(
                            styles.input,
                            (hasNoData(value.filterEntryPublishers) && !filtersExpanded)
                            && styles.hidden,
                        )}
                        label="Publishers"
                        options={publisherOptions}
                        name="filterEntryPublishers"
                        onOptionsChange={setPublishers}
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
                        options={sourceOptions}
                        name="filterFigureSources"
                        onOptionsChange={setSources}
                        onChange={onValueChange}
                        value={value.filterFigureSources}
                        error={error?.fields?.filterFigureSources?.$internal}
                        disabled={disabled}
                    />
                    <MultiSelectInput<FigureReviewStatus, 'filterFigureReviewStatus', NonNullable<ReviewStatusOptions>[number], { containerClassName?: string }>
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
                        options={tagOptions}
                        label="Tags"
                        name="filterFigureTags"
                        error={error?.fields?.filterFigureTags?.$internal}
                        value={value.filterFigureTags}
                        onChange={onValueChange}
                        disabled={disabled}
                        onOptionsChange={setTags}
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
            </Container>
        </form>
    );
}

export default ExtractionFilters;
