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
type FormType = PurgeNull<PartialForm<
    Omit<NewExtractionFiltersFields, 'figureRoles' | 'eventCrisisTypes'>
    & { figureRoles: string[], eventCrisisTypes: string[] }
>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;
const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        eventRegions: [],
        eventCountries: [],
        eventCrises: [],
        eventCrisisTypes: [],
        entryTags: [],
        entryArticleTitle: [],

        figureRoles: [],
        figureStartAfter: [],
        figureEndBefore: [],
        figureCategories: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    eventRegions: [],
    eventCountries: [],
    eventCrises: [],
    figureCategories: [],
    entryTags: [],
    figureRoles: [],
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
        eventCountries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        eventRegions,
        setRegions,
    ] = useState<RegionOption[] | null | undefined>();
    const [
        eventCrises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>();
    const [
        entryTags,
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

                if (otherAttrs.eventRegions) {
                    setRegions(otherAttrs.eventRegions);
                }
                if (otherAttrs.eventCountries) {
                    setCountries(otherAttrs.eventCountries);
                }
                if (otherAttrs.eventCrises) {
                    setCrises(otherAttrs.eventCrises);
                }
                if (otherAttrs.entryTags) {
                    setTags(otherAttrs.entryTags);
                }
                onFormValueSet(removeNull({
                    eventRegions: otherAttrs.eventRegions?.map((r) => r.id),
                    eventCountries: otherAttrs.eventCountries?.map((c) => c.id),
                    eventCrises: otherAttrs.eventCrises?.map((cr) => cr.id),
                    figureCategories: otherAttrs.figureCategories?.map((fc) => fc.id),
                    entryTags: otherAttrs.entryTags?.map((ft) => ft.id),
                    figureRoles: otherAttrs.figureRoles,
                    figureStartAfter: otherAttrs.figureStartAfter,
                    figureEndBefore: otherAttrs.figureEndBefore,
                    entryArticleTitle: otherAttrs.entryArticleTitle,
                    eventCrisisTypes: otherAttrs.eventCrisisTypes,
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
                    options={eventRegions}
                    onOptionsChange={setRegions}
                    label="Regions"
                    name="eventRegions"
                    value={value.eventRegions}
                    onChange={onValueChange}
                    error={error?.fields?.eventRegions}
                    disabled={disabled}
                />
                <CountryMultiSelectInput
                    options={eventCountries}
                    onOptionsChange={setCountries}
                    label="Countries"
                    name="eventCountries"
                    value={value.eventCountries}
                    onChange={onValueChange}
                    error={error?.fields?.eventCountries}
                    disabled={disabled}
                    regions={value.eventRegions}
                />
                <MultiSelectInput
                    options={data?.crisisType?.enumValues}
                    label="Crisis Type"
                    name="eventCrisisTypes"
                    value={value.eventCrisisTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.eventCrisisTypes}
                    disabled={disabled}
                />
                <CrisisMultiSelectInput
                    options={eventCrises}
                    label="Crisis"
                    name="eventCrises"
                    error={error?.fields?.eventCrises}
                    value={value.eventCrises}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setCrises}
                    countries={value.eventCountries}
                />
            </Row>
            <Row>
                <TextInput
                    icons={<IoIosSearch />}
                    label="Search"
                    name="entryArticleTitle"
                    value={value.entryArticleTitle}
                    onChange={onValueChange}
                    error={error?.fields?.entryArticleTitle}
                    disabled={disabled}
                />
                <FigureTagMultiSelectInput
                    options={entryTags}
                    label="Tag"
                    name="entryTags"
                    error={error?.fields?.entryTags}
                    value={value.entryTags}
                    onChange={onValueChange}
                    disabled={disabled}
                    onOptionsChange={setTags}
                />
                <DateInput
                    label="Start Date"
                    name="figureStartAfter"
                    value={value.figureStartAfter}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.figureStartAfter}
                />
                <DateInput
                    label="End Date"
                    name="figureEndBefore"
                    value={value.figureEndBefore}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.figureEndBefore}
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
                <MultiSelectInput
                    options={data?.figureCategoryList?.results}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    label="Figure Type *"
                    name="figureCategories"
                    value={value.figureCategories}
                    onChange={onValueChange}
                    error={error?.fields?.figureCategories}
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
