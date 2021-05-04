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

import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput, { GeographicOption } from '#components/selections/GeographicMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import Row from '#components/Row';

import { enumKeySelector, enumLabelSelector } from '#utils/common';
import {
    FormOptionsQuery,
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
type FormType = PurgeNull<PartialForm<
    Omit<NewExtractionFiltersFields, 'filterFigureRoles' | 'filterEventCrisisTypes'>
    & { filterFigureRoles: string[], filterEventCrisisTypes: string[] }
>>;

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
        filterFigureStartAfter: [],
        filterFigureEndBefore: [],
        filterFigureCategories: [arrayCondition],
        filterFigureGeographicalGroups: [arrayCondition],
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
}

function NewExtractionFilters(props: NewExtractionFiltersProps) {
    const {
        id,
        className,
        setExtractionQueryFilters,
        setExtractionQueryFiltersMeta,
    } = props;

    const [
        filterFigureCountries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
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

    /*
    const onSetExtractionQueryFilters = useCallback(
        () => {
            setExtractionQueryFilters(value);
        },
        [value, setExtractionQueryFilters],
    );
    */

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
                onFormValueSet(removeNull({
                    filterFigureRegions: otherAttrs.filterFigureRegions?.map((r) => r.id),
                    // eslint-disable-next-line max-len
                    filterFigureGeographicalGroups: otherAttrs.filterFigureGeographicalGroups?.map((r) => r.id),
                    filterFigureCountries: otherAttrs.filterFigureCountries?.map((c) => c.id),
                    filterEventCrises: otherAttrs.filterEventCrises?.map((cr) => cr.id),
                    filterFigureCategories: otherAttrs.filterFigureCategories?.map((fc) => fc.id),
                    filterEntryTags: otherAttrs.filterEntryTags?.map((ft) => ft.id),
                    filterFigureRoles: otherAttrs.filterFigureRoles,
                    filterFigureStartAfter: otherAttrs.filterFigureStartAfter,
                    filterFigureEndBefore: otherAttrs.filterFigureEndBefore,
                    filterEntryArticleTitle: otherAttrs.filterEntryArticleTitle,
                    filterEventCrisisTypes: otherAttrs.filterEventCrisisTypes,
                }));
            },
        },
    );

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFormValues);
            setExtractionQueryFilters(initialFormValues);
            notify({
                children: id
                    ? 'Filters reset successfully'
                    : 'Filters cleared successfully.',
            });
        },
        [onValueSet, notify, id, initialFormValues, setExtractionQueryFilters],
    );

    const {
        data,
        loading: queryOptionsLoading,
        error: queryOptionsError,
    } = useQuery<FormOptionsQuery>(FORM_OPTIONS);

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        setExtractionQueryFilters(finalValues);
        onPristineSet(true);
    }, [setExtractionQueryFilters, onPristineSet]);

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
                    disabled={disabled}
                />
                <CrisisMultiSelectInput
                    options={filterEventCrises}
                    label="Crisis"
                    name="filterEventCrises"
                    error={error?.fields?.filterEventCrises?.$internal}
                    value={value.filterEventCrises}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setCrises}
                    countries={value.filterFigureCountries}
                />
                <MultiSelectInput
                    options={data?.reportReviewFilter?.enumValues}
                    label="Status"
                    name="reviewStatus"
                    value={value.reviewStatus}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.reviewStatus?.$internal}
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
                <FigureTagMultiSelectInput
                    options={filterEntryTags}
                    label="Tag"
                    name="filterEntryTags"
                    error={error?.fields?.filterEntryTags?.$internal}
                    value={value.filterEntryTags}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setTags}
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
                    label="Role"
                    name="filterFigureRoles"
                    value={value.filterFigureRoles}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterFigureRoles?.$internal}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <MultiSelectInput
                    options={data?.figureCategoryList?.results}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    label="Figure Type *"
                    name="filterFigureCategories"
                    value={value.filterFigureCategories}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCategories?.$internal}
                    disabled={disabled}
                    groupLabelSelector={groupLabelSelector}
                    groupKeySelector={groupKeySelector}
                    grouped
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
