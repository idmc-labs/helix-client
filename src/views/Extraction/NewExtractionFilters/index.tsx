import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
    DateInput,
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
import { useQuery } from '@apollo/client';

import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput, { GeographicOption } from '#components/selections/GeographicMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';
import FigureTermMultiSelectInput, { FigureTermOption } from '#components/selections/FigureTermMultiSelectInput';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import Row from '#components/Row';

import {
    enumKeySelector,
    enumLabelSelector,
    EnumFix,
} from '#utils/common';
import {
    ExtractionFormOptionsQuery,
    ExtractionForFormQuery,
    ExtractionForFormQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
    CreateExtractionMutationVariables,
} from '#generated/types';
import {
    FORM_OPTIONS,
    EXTRACTION_FILTER,
} from '../queries';
import styles from './styles.css';

// NOTE: should have used ExtractionEntryListFiltersQueryVariables instead of
// CreateExtractionMutationVariables['extraction'] but the type is looser
// eslint-disable-next-line @typescript-eslint/ban-types
type NewExtractionFiltersFields = CreateExtractionMutationVariables['extraction'];
type FormType = PurgeNull<PartialForm<EnumFix<
    NewExtractionFiltersFields,
    'filterFigureRoles' | 'filterEventCrisisTypes' | 'filterEntryReviewStatus' | 'filterFigureDisplacementTypes' | 'filterFigureSexTypes' | 'filterFigureCategories' | 'filterEntryCreatedBy'
>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;
const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterFigureRegions: [arrayCondition],
        filterFigureCountries: [arrayCondition],
        filterEventCrises: [arrayCondition],
        filterEventCrisisTypes: [arrayCondition],
        filterEntryTags: [arrayCondition],
        filterEntryArticleTitle: [],

        filterFigureRoles: [arrayCondition],
        filterFigureTerms: [arrayCondition],
        filterFigureStartAfter: [],
        filterFigureEndBefore: [],
        filterFigureCategories: [arrayCondition],
        filterFigureGeographicalGroups: [arrayCondition],
        filterEntryPublishers: [arrayCondition],
        filterEntrySources: [arrayCondition],
        filterEventGlideNumber: [],
        filterFigureSexTypes: [arrayCondition],
        filterEntryCreatedBy: [arrayCondition],
        filterFigureDisplacementTypes: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    filterFigureRegions: [],
    filterFigureCountries: [],
    filterEventCrises: [],
    filterFigureCategories: [],
    filterEntryTags: [],
    filterFigureRoles: [],
    filterFigureGeographicalGroups: [],
    filterEntryPublishers: [],
    filterEntrySources: [],
    filterEventGlideNumber: undefined,
    filterFigureSexTypes: [],
    filterFigureTerms: [],
    filterEntryCreatedBy: [],
    filterFigureDisplacementTypes: [],
};

interface Category {
    id: string;
    name: string;
    type: string;
}

const keySelector = (item: Category) => item.id;
const labelSelector = (item: Category) => item.name;
const groupKeySelector = (item: Category) => item.type;
const groupLabelSelector = (item: Category) => item.type;

interface NewExtractionFiltersProps {
    id?: string;
    className?: string;
    setExtractionQueryFilters: React.Dispatch<React.SetStateAction<
        ExtractionEntryListFiltersQueryVariables | undefined
    >>;
    setExtractionQueryFiltersMeta: React.Dispatch<React.SetStateAction<
        { name?: string, id?: string }
    >>;
    onFilterChange: (value: PurgeNull<ExtractionEntryListFiltersQueryVariables>) => void;
}

function NewExtractionFilters(props: NewExtractionFiltersProps) {
    const {
        id,
        className,
        onFilterChange,
        setExtractionQueryFilters,
        setExtractionQueryFiltersMeta,
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
        filterEntryTags,
        setTags,
    ] = useState<FigureTagOption[] | null | undefined>();
    const [
        filterFigureTerms,
        setTerms,
    ] = useState<FigureTermOption[] | null | undefined>();
    const [
        sourceOptions,
        setSources,
    ] = useState<OrganizationOption[] | undefined | null>();
    const [
        publisherOptions,
        setPublishers,
    ] = useState<OrganizationOption[] | undefined | null>();

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
            setExtractionQueryFilters(formValue);
            onValueSet(formValue);
            setInitialFormValues(formValue);
        },
        [setExtractionQueryFilters, onValueSet, setInitialFormValues],
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
                setExtractionQueryFiltersMeta({
                    id: extractionId,
                    name: extractionName,
                });

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
                if (otherAttrs.filterEntryTags) {
                    setTags(otherAttrs.filterEntryTags);
                }
                if (otherAttrs.filterFigureTerms) {
                    setTerms(otherAttrs.filterFigureTerms);
                }
                if (otherAttrs.filterEntrySources) {
                    setSources(otherAttrs.filterEntrySources);
                }
                if (otherAttrs.filterEntryPublishers) {
                    setPublishers(otherAttrs.filterEntryPublishers);
                }
                onFormValueSet(removeNull({
                    filterFigureRegions: otherAttrs.filterFigureRegions?.map((r) => r.id),
                    // eslint-disable-next-line max-len
                    filterFigureGeographicalGroups: otherAttrs.filterFigureGeographicalGroups?.map((r) => r.id),
                    filterFigureCountries: otherAttrs.filterFigureCountries?.map((c) => c.id),
                    filterEventCrises: otherAttrs.filterEventCrises?.map((cr) => cr.id),
                    filterFigureCategories: otherAttrs.filterFigureCategories?.map((fc) => fc.id),
                    filterEntryTags: otherAttrs.filterEntryTags?.map((ft) => ft.id),
                    filterFigureTerms: otherAttrs.filterFigureTerms?.map((Fterms) => Fterms.id),
                    filterFigureRoles: otherAttrs.filterFigureRoles,
                    filterFigureStartAfter: otherAttrs.filterFigureStartAfter,
                    filterFigureEndBefore: otherAttrs.filterFigureEndBefore,
                    filterEntryArticleTitle: otherAttrs.filterEntryArticleTitle,
                    filterEventCrisisTypes: otherAttrs.filterEventCrisisTypes,
                    filterEntryPublishers: otherAttrs.filterEntryPublishers?.map((fp) => fp.id),
                    filterEntrySources: otherAttrs.filterEntrySources?.map((fp) => fp.id),
                }));
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
            <Row>
                <RegionMultiSelectInput
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
            </Row>
            <Row>
                <TextInput
                    icons={<IoIosSearch />}
                    label="Search"
                    name="filterEntryArticleTitle"
                    value={value.filterEntryArticleTitle}
                    onChange={onValueChange}
                    error={error?.fields?.filterEntryArticleTitle}
                    disabled={disabled}
                />
                <MultiSelectInput
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
                <OrganizationMultiSelectInput
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
                    label="Sources"
                    options={sourceOptions}
                    name="filterEntrySources"
                    onOptionsChange={setSources}
                    onChange={onValueChange}
                    value={value.filterEntrySources}
                    error={error?.fields?.filterEntrySources?.$internal}
                    disabled={disabled}
                />
                <FigureTagMultiSelectInput
                    options={filterEntryTags}
                    label="Tags"
                    name="filterEntryTags"
                    error={error?.fields?.filterEntryTags?.$internal}
                    value={value.filterEntryTags}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setTags}
                />
            </Row>
            <Row>
                <UserMultiSelectInput
                    options={createdByOptions}
                    label="Created By"
                    name="filterEntryCreatedBy"
                    value={value.filterEntryCreatedBy}
                    onChange={onValueChange}
                    onOptionsChange={setCreatedByOptions}
                    error={error?.fields?.filterEntryCreatedBy?.$internal}
                    disabled={disabled}
                />
                <DateInput
                    label="Start Date"
                    name="filterFigureStartAfter"
                    value={value.filterFigureStartAfter}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.filterFigureStartAfter}
                />
                <DateInput
                    label="End Date"
                    name="filterFigureEndBefore"
                    value={value.filterFigureEndBefore}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.filterFigureEndBefore}
                />
                <MultiSelectInput
                    options={data?.filterFigureRoles?.enumValues}
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
                    options={data?.genderList?.enumValues}
                    label="Sex Disaggregation"
                    name="filterFigureSexTypes"
                    value={value.filterFigureSexTypes}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureSexTypes?.$internal}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <MultiSelectInput
                    options={data?.figureCategoryList?.results}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    label="Figure Types"
                    name="filterFigureCategories"
                    value={value.filterFigureCategories}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCategories?.$internal}
                    disabled={disabled}
                    groupLabelSelector={groupLabelSelector}
                    groupKeySelector={groupKeySelector}
                    grouped
                />
                <FigureTermMultiSelectInput
                    options={filterFigureTerms}
                    label="Figure Terms"
                    name="filterFigureTerms"
                    value={value.filterFigureTerms}
                    onChange={onValueChange}
                    error={error?.fields?.filterEntryTags?.$internal}
                    disabled={disabled}
                    onOptionsChange={setTerms}
                />
                <MultiSelectInput
                    options={data?.displacementType?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Rural /Urban"
                    name="filterFigureDisplacementTypes"
                    value={value.filterFigureDisplacementTypes}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureDisplacementTypes?.$internal}
                    disabled={disabled}
                />
                <TextInput
                    label="Glide Number"
                    name="filterEventGlideNumber"
                    value={value.filterEventGlideNumber}
                    onChange={onValueChange}
                    error={error?.fields?.filterEventGlideNumber}
                    disabled={disabled}
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
            </div>
        </form>
    );
}

export default NewExtractionFilters;
