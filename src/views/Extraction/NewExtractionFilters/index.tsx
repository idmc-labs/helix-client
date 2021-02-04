import React, { useState, useContext, useCallback } from 'react';
import {
    DateInput,
    TextInput,
    Button,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import { IoIosSearch } from 'react-icons/io';
import { useQuery } from '@apollo/client';

import RegionMultiSelectInput, { RegionOption } from '#components/RegionMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/CrisisMultiSelectInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/FigureTagMultiSelectInput';
import FigureCategoryMultiSelectInput, { FigureCategoryOption } from '#components/FigureCategoryMultiSelectInput';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import Row from '#components/EntryForm/Row';

import { removeNull } from '#utils/schema';
import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';

import { PartialForm, PurgeNull } from '#types';
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
type FormType = PurgeNull<PartialForm<Omit<NewExtractionFiltersFields, 'figureRoles'> & { figureRoles: string[] }>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;
const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        regions: [],
        countries: [],
        crises: [],
        figureCategories: [],
        figureTags: [],

        figureRoles: [],
        eventAfter: [],
        eventBefore: [],
        articleTitle: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    regions: [],
    countries: [],
    crises: [],
    figureCategories: [],
    figureTags: [],
    figureRoles: [],
};

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
        countries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        regions,
        setRegions,
    ] = useState<RegionOption[] | null | undefined>();
    const [
        crises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>();
    const [
        figureTags,
        setFigureTags,
    ] = useState<FigureTagOption[] | null | undefined>();
    const [
        figureCategories,
        setFigureCategories,
    ] = useState<FigureCategoryOption[] | null | undefined>();

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

    const {
        loading: extractionQueryLoading,
        error: extractionDataError,
    } = useQuery<ExtractionForFormQuery, ExtractionForFormQueryVariables>(
        EXTRACTION_FILTER,
        {
            skip: !id,
            variables: id ? { id } : undefined,
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

                if (otherAttrs.regions) {
                    setRegions(otherAttrs.regions);
                }
                if (otherAttrs.countries) {
                    setCountries(otherAttrs.countries);
                }
                if (otherAttrs.crises) {
                    setCrises(otherAttrs.crises);
                }
                if (otherAttrs.figureCategories) {
                    setFigureCategories(otherAttrs.figureCategories);
                }
                if (otherAttrs.figureTags) {
                    setFigureTags(otherAttrs.figureTags);
                }
                onFormValueSet(removeNull({
                    regions: otherAttrs.regions?.map((r) => r.id),
                    countries: otherAttrs.countries?.map((c) => c.id),
                    crises: otherAttrs.crises?.map((cr) => cr.id),
                    figureCategories: otherAttrs.figureCategories?.map((fc) => fc.id),
                    figureTags: otherAttrs.figureTags?.map((ft) => ft.id),
                    figureRoles: otherAttrs.figureRoles,
                    eventAfter: otherAttrs.eventAfter,
                    eventBefore: otherAttrs.eventBefore,
                    articleTitle: otherAttrs.articleTitle,
                }));
            },
        },
    );

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFormValues);
            notify({
                children: id
                    ? 'Filters reset successfully'
                    : 'Filters cleared successfully.',
            });
        },
        [onValueSet, notify, id, initialFormValues],
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
                <TextInput
                    icons={<IoIosSearch />}
                    label="Search"
                    name="articleTitle"
                    value={value.articleTitle}
                    onChange={onValueChange}
                    error={error?.fields?.articleTitle}
                    disabled={disabled}
                />
                <RegionMultiSelectInput
                    options={regions}
                    onOptionsChange={setRegions}
                    label="Regions"
                    name="regions"
                    value={value.regions}
                    onChange={onValueChange}
                    error={error?.fields?.regions}
                    disabled={disabled}
                />
                <CountryMultiSelectInput
                    options={countries}
                    onOptionsChange={setCountries}
                    label="Countries"
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    error={error?.fields?.countries}
                    disabled={disabled}
                    regions={value.regions}
                />
                <DateInput
                    label="Start Date"
                    name="eventAfter"
                    value={value.eventAfter}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.eventAfter}
                />
                <DateInput
                    label="End Date"
                    name="eventBefore"
                    value={value.eventBefore}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.eventBefore}
                />
            </Row>
            <Row>
                <CrisisMultiSelectInput
                    options={crises}
                    label="Crisis"
                    name="crises"
                    error={error?.fields?.crises}
                    value={value.crises}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setCrises}
                    countries={value.countries}
                />
                <MultiSelectInput
                    options={data?.figureRoles?.enumValues}
                    label="Role"
                    name="figureRoles"
                    value={value.figureRoles}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.figureRoles}
                    disabled={disabled || queryOptionsLoading || !!queryOptionsError}
                />
                <FigureCategoryMultiSelectInput
                    // TODO: don't do lazy load
                    options={figureCategories}
                    label="Figure Type"
                    name="figureCategories"
                    error={error?.fields?.figureCategories}
                    value={value.figureCategories}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setFigureCategories}
                />
                <FigureTagMultiSelectInput
                    options={figureTags}
                    label="Tag"
                    name="figureTags"
                    error={error?.fields?.figureTags}
                    value={value.figureTags}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setFigureTags}
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
