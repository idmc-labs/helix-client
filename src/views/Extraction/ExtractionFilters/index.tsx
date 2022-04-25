import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
    DateRangeDualInput,
    TextInput,
    Button,
    MultiSelectInput,
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
import { IoIosSearch } from 'react-icons/io';
import {
    IoChevronUpOutline,
    IoChevronDownOutline,
} from 'react-icons/io5';
import { gql, useQuery } from '@apollo/client';

import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput, { GeographicOption } from '#components/selections/GeographicMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';
import EventMultiSelectInput, { EventOption } from '#components/selections/EventMultiSelectInput';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import Row from '#components/Row';

import {
    enumKeySelector,
    enumLabelSelector,
    EnumFix,
    hasNoData,
} from '#utils/common';
import useBooleanState from '#utils/useBooleanState';
import {
    ExtractionFormOptionsQuery,
    ExtractionForFormQuery,
    ExtractionForFormQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
    CreateExtractionMutationVariables,
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
        entryReviewStatus: __type(name: "REVIEW_STATUS") {
            name
            enumValues {
                name
                description
            }
        }
        displacementType: __type(name: "DISPLACEMENT_TYPE") {
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
            filterEventCrises {
                id
                name
            }
            filterEntryReviewStatus
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
            filterEntrySources {
                id
                name
            }
            filterEntryPublishers {
                id
                name
            }
            filterEntryArticleTitle
            filterEventCrisisTypes
            filterEntryHasDisaggregatedData
            filterFigureDisplacementTypes
            filterEvents {
                id
                name
            }
            filterEntryCreatedBy {
              id
              fullName
            }
            filterFigureTerms
            filterEntryHasReviewComments
            createdAt
            createdBy {
              fullName
              id
            }
        }
    }
`;

// NOTE: should have used ExtractionEntryListFiltersQueryVariables instead of
// CreateExtractionMutationVariables['extraction'] but the type is looser
// eslint-disable-next-line @typescript-eslint/ban-types
type ExtractionFiltersFields = CreateExtractionMutationVariables['extraction'];
type FormType = PurgeNull<PartialForm<EnumFix<
    ExtractionFiltersFields,
    'filterFigureRoles' | 'filterEventCrisisTypes' | 'filterEntryReviewStatus' | 'filterFigureDisplacementTypes' | 'filterFigureCategories' | 'filterFigureCategoryTypes' | 'filterEntryCreatedBy' | 'filterFigureTerms'
>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;
const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterFigureRegions: [arrayCondition],
        filterFigureCountries: [arrayCondition],
        filterEventCrises: [arrayCondition],
        filterEventCrisisTypes: [arrayCondition],
        filterFigureTags: [arrayCondition],
        filterEntryArticleTitle: [],

        filterEntryReviewStatus: [arrayCondition],
        filterFigureRoles: [arrayCondition],
        filterFigureTerms: [arrayCondition],
        filterFigureStartAfter: [],
        filterFigureEndBefore: [],
        filterFigureCategories: [arrayCondition],
        filterFigureCategoryTypes: [],
        filterFigureGeographicalGroups: [arrayCondition],
        filterEntryPublishers: [arrayCondition],
        filterEntrySources: [arrayCondition],
        filterEntryHasDisaggregatedData: [],
        filterEntryCreatedBy: [arrayCondition],
        filterFigureDisplacementTypes: [arrayCondition],
        filterEntryHasReviewComments: [],
        filterEvents: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    filterFigureRegions: [],
    filterFigureCountries: [],
    filterEventCrises: [],
    filterFigureCategories: [],
    filterFigureCategoryTypes: undefined,
    filterFigureTags: [],
    filterFigureRoles: [],
    filterFigureGeographicalGroups: [],
    filterEntryPublishers: [],
    filterEntrySources: [],
    filterFigureTerms: [],
    filterEntryCreatedBy: [],
    filterFigureDisplacementTypes: [],
    filterEntryReviewStatus: [],
    filterEntryHasReviewComments: undefined,
    filterEvents: [],
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
        filterFigureCountries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        createdByOptions,
        setCreatedByOptions,
    ] = useState<UserOption[] | null | undefined>();
    const [
        filterFigureRegions,
        setRegions,
    ] = useState<RegionOption[] | null | undefined>();
    const [
        filterFigureGeographicalGroups,
        setGeographicGroups,
    ] = useState<GeographicOption[] | null | undefined>();
    const [
        filterEventCrises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>();
    const [
        filterFigureTags,
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
        allFiltersVisible, , , ,
        toggleAllFiltersVisibility,
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
                if (otherAttrs.filterEventCrises) {
                    setCrises(otherAttrs.filterEventCrises);
                }
                if (otherAttrs.filterFigureTags) {
                    setTags(otherAttrs.filterFigureTags);
                }
                if (otherAttrs.filterEntrySources) {
                    setSources(otherAttrs.filterEntrySources);
                }
                if (otherAttrs.filterEntryPublishers) {
                    setPublishers(otherAttrs.filterEntryPublishers);
                }
                if (otherAttrs.filterEvents) {
                    setEventOptions(otherAttrs.filterEvents);
                }
                const formValue = removeNull({
                    filterFigureRegions: otherAttrs.filterFigureRegions?.map((r) => r.id),
                    // eslint-disable-next-line max-len
                    filterFigureGeographicalGroups: otherAttrs.filterFigureGeographicalGroups?.map((r) => r.id),
                    filterFigureCountries: otherAttrs.filterFigureCountries?.map((c) => c.id),
                    filterEventCrises: otherAttrs.filterEventCrises?.map((cr) => cr.id),
                    filterEntryReviewStatus: otherAttrs.filterEntryReviewStatus,
                    filterFigureCategories: otherAttrs.filterFigureCategories,
                    // eslint-disable-next-line max-len
                    filterFigureCategoryTypes: otherAttrs.filterFigureCategories,
                    filterFigureTags: otherAttrs.filterFigureTags?.map((ft) => ft.id),
                    filterFigureTerms: otherAttrs.filterFigureTerms,
                    filterFigureRoles: otherAttrs.filterFigureRoles,
                    filterFigureStartAfter: otherAttrs.filterFigureStartAfter,
                    filterFigureEndBefore: otherAttrs.filterFigureEndBefore,
                    filterEntryArticleTitle: otherAttrs.filterEntryArticleTitle,
                    filterEventCrisisTypes: otherAttrs.filterEventCrisisTypes,
                    filterEntryPublishers: otherAttrs.filterEntryPublishers?.map((fp) => fp.id),
                    filterEntrySources: otherAttrs.filterEntrySources?.map((fp) => fp.id),
                    filterEvents: otherAttrs.filterEvents?.map((e) => e.id),
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

    const loading = extractionQueryLoading;
    const errored = !!extractionDataError;
    const disabled = loading || errored;

    const filterChanged = initialFormValues !== value;

    return (
        <form
            className={_cs(className, styles.queryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div
                className={_cs(
                    styles.label,
                    !allFiltersVisible && styles.hidden,
                )}
            >
                Overall Search Filters
            </div>
            <Row singleColumnNoGrow>
                <TextInput
                    icons={<IoIosSearch />}
                    label="Search"
                    name="filterEntryArticleTitle"
                    value={value.filterEntryArticleTitle}
                    onChange={onValueChange}
                    error={error?.fields?.filterEntryArticleTitle}
                    disabled={disabled}
                />
                <DateRangeDualInput
                    label="Date Range"
                    fromName="filterFigureStartAfter"
                    toName="filterFigureEndBefore"
                    fromValue={value.filterFigureStartAfter}
                    toValue={value.filterFigureEndBefore}
                    fromOnChange={onValueChange}
                    toOnChange={onValueChange}
                    fromError={error?.fields?.filterFigureStartAfter}
                    toError={error?.fields?.filterFigureEndBefore}
                />
            </Row>
            <div
                className={_cs(
                    styles.label,
                    !allFiltersVisible && styles.hidden,
                )}
            >
                Event Filters
            </div>
            <Row>
                <MultiSelectInput
                    options={data?.crisisType?.enumValues}
                    label="Causes"
                    name="filterEventCrisisTypes"
                    value={value.filterEventCrisisTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterEventCrisisTypes?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <CrisisMultiSelectInput
                    options={filterEventCrises}
                    label="Crises"
                    name="filterEventCrises"
                    error={error?.fields?.filterEventCrises?.$internal}
                    value={value.filterEventCrises}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setCrises}
                    countries={value.filterFigureCountries}
                />
                <EventMultiSelectInput
                    label="Events"
                    options={eventOptions}
                    name="filterEvents"
                    onOptionsChange={setEventOptions}
                    onChange={onValueChange}
                    value={value.filterEvents}
                    error={error?.fields?.filterEvents?.$internal}
                    disabled={disabled}
                />
            </Row>
            <div
                className={_cs(
                    styles.label,
                    !allFiltersVisible && styles.hidden,
                )}
            >
                Source Filters
            </div>
            <Row
                className={_cs(
                    styles.input,
                    (hasNoData(value.filterEntryCreatedBy)
                        && hasNoData(value.filterEntryPublishers)
                        && hasNoData(value.filterEntrySources)
                        && hasNoData(value.filterEntryReviewStatus)
                        && !allFiltersVisible)
                    && styles.hidden,
                )}
            >
                <UserMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterEntryCreatedBy) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={createdByOptions}
                    label="Created By"
                    name="filterEntryCreatedBy"
                    value={value.filterEntryCreatedBy}
                    onChange={onValueChange}
                    onOptionsChange={setCreatedByOptions}
                    error={error?.fields?.filterEntryCreatedBy?.$internal}
                    disabled={disabled}
                />
                <OrganizationMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterEntryPublishers) && !allFiltersVisible)
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
                        (hasNoData(value.filterEntrySources) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    label="Sources"
                    options={sourceOptions}
                    name="filterEntrySources"
                    onOptionsChange={setSources}
                    onChange={onValueChange}
                    value={value.filterEntrySources}
                    error={error?.fields?.filterEntrySources?.$internal}
                    disabled={disabled}
                />
                <MultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterEntryReviewStatus) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={data?.entryReviewStatus?.enumValues}
                    label="Statuses"
                    name="filterEntryReviewStatus"
                    value={value.filterEntryReviewStatus}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterEntryReviewStatus?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
            </Row>
            <div
                className={_cs(
                    styles.label,
                    !allFiltersVisible && styles.hidden,
                )}
            >
                Figure Has Filters
            </div>
            <Row
                singleColumnNoGrow
                className={_cs(
                    styles.input,
                    (hasNoData(value.filterEntryHasReviewComments)
                        && hasNoData(value.filterEntryHasDisaggregatedData)
                        && !allFiltersVisible)
                    && styles.hidden,
                )}
            >
                <BooleanInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterEntryHasReviewComments) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    label="Has Comments"
                    name="filterEntryHasReviewComments"
                    error={error?.fields?.filterEntryHasReviewComments}
                    value={value.filterEntryHasReviewComments}
                    onChange={onValueChange}
                    disabled={disabled}
                />
                <BooleanInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterEntryHasReviewComments) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    label="Has Age/Sex Disaggregation"
                    name="filterEntryHasDisaggregatedData"
                    value={value.filterEntryHasDisaggregatedData}
                    onChange={onValueChange}
                    error={error?.fields?.filterEntryHasDisaggregatedData}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
            </Row>
            <div
                className={_cs(
                    styles.label,
                    !allFiltersVisible && styles.hidden,
                )}
            >
                Location Filters
            </div>
            <Row
                className={_cs(
                    styles.input,
                    (hasNoData(value.filterFigureRegions)
                        && hasNoData(value.filterFigureGeographicalGroups)
                        && hasNoData(value.filterFigureCountries)
                        && hasNoData(value.filterFigureDisplacementTypes)
                        && !allFiltersVisible)
                    && styles.hidden,
                )}
            >
                <RegionMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureRegions) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={filterFigureRegions}
                    onOptionsChange={setRegions}
                    label="Regions"
                    name="filterFigureRegions"
                    value={value.filterFigureRegions}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureRegions?.$internal}
                    disabled={disabled}
                />
                <GeographicMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureGeographicalGroups) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={filterFigureGeographicalGroups}
                    onOptionsChange={setGeographicGroups}
                    label="Geographic Regions"
                    name="filterFigureGeographicalGroups"
                    value={value.filterFigureGeographicalGroups}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureGeographicalGroups?.$internal}
                    disabled={disabled}
                />
                <CountryMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureCountries) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={filterFigureCountries}
                    onOptionsChange={setCountries}
                    label="Countries"
                    name="filterFigureCountries"
                    value={value.filterFigureCountries}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCountries?.$internal}
                    disabled={disabled}
                />
                <MultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureDisplacementTypes) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={data?.displacementType?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Rural/Urban Disaggregation"
                    name="filterFigureDisplacementTypes"
                    value={value.filterFigureDisplacementTypes}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureDisplacementTypes?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
            </Row>
            <div
                className={_cs(
                    styles.label,
                    !allFiltersVisible && styles.hidden,
                )}
            >
                Category Filters
            </div>
            <Row
                className={_cs(
                    styles.input,
                    (hasNoData(value.filterFigureRoles)
                        && hasNoData(value.filterFigureCategoryTypes)
                        && hasNoData(value.filterFigureCategories)
                        && hasNoData(value.filterFigureTerms)
                        && hasNoData(value.filterFigureTags)
                        && !allFiltersVisible)
                    && styles.hidden,
                )}
            >
                <MultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureRoles) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={data?.figureRoleList?.enumValues}
                    label="Roles"
                    name="filterFigureRoles"
                    value={value.filterFigureRoles}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureRoles?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <MultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureCategoryTypes) && !allFiltersVisible)
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
                        (hasNoData(value.filterFigureCategories) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={data?.figureCategoryList?.enumValues}
                    label="Categories"
                    name="filterFigureCategories"
                    value={value.filterFigureCategories}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCategories?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    // groupLabelSelector={categoryGroupLabelSelector}
                    // groupKeySelector={categoryGroupKeySelector}
                    // grouped
                />
                <MultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureTerms) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={data?.figureTermList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Terms"
                    name="filterFigureTerms"
                    value={value.filterFigureTerms}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureTerms?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <FigureTagMultiSelectInput
                    className={_cs(
                        styles.input,
                        (hasNoData(value.filterFigureTags) && !allFiltersVisible)
                        && styles.hidden,
                    )}
                    options={filterFigureTags}
                    label="Tags"
                    name="filterFigureTags"
                    error={error?.fields?.filterFigureTags?.$internal}
                    value={value.filterFigureTags}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setTags}
                />
            </Row>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onResetFilters}
                    title="Reset Filters"
                    disabled={!filterChanged}
                    className={styles.button}
                >
                    Reset
                </Button>
                <Button
                    name={undefined}
                    type="submit"
                    title="Apply"
                    disabled={disabled || pristine}
                    className={styles.button}
                    variant="primary"
                >
                    Apply
                </Button>
                <Button
                    name="showAll"
                    variant="default"
                    className={styles.button}
                    actions={allFiltersVisible ? (
                        <IoChevronUpOutline />
                    ) : (
                        <IoChevronDownOutline />
                    )}
                    onClick={toggleAllFiltersVisibility}
                >
                    {allFiltersVisible ? 'Show Less' : 'Show All'}
                </Button>
            </div>
        </form>
    );
}

export default ExtractionFilters;
