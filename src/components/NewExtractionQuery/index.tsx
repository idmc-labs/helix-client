import React, { useState, useContext, useCallback } from 'react';
import {
    DateInput,
    TextInput,
    SelectInput,
    Button,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import RegionMultiSelectInput, { RegionOption } from '#components/RegionMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/CountryMultiSelectInput';
import CrisisMultiSelectInput, { CrisisOption } from '#components/CrisisMultiSelectInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/FigureTagMultiSelectInput';
import FigureCategoryMultiSelectInput, { FigureCategoryOption } from '#components/FigureCategoryMultiSelectInput';

import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import NonFieldError from '#components/NonFieldError';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import { removeNull } from '#utils/schema';
import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';
import {
    idCondition,
    requiredStringCondition,
} from '#utils/validation';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    QueryOptionsQuery,
    ExtractionForFormQuery,
    ExtractionForFormQueryVariables,
    CreateExtractionMutation,
    CreateExtractionMutationVariables,
    UpdateExtractionMutation,
    UpdateExtractionMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const QUERY_OPTIONS = gql`
    query QueryOptions {
        figureRoles: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

const EXTRACTION_QUERY = gql`
    query ExtractionForForm($id: ID!) {
        extractionQuery(id: $id) {
            countries {
                id
                name
            }
            crises {
                id
                name
            }
            eventAfter
            eventBefore
            figureCategories {
                id
                name
            }
            figureRoles
            figureTags {
                id
                name
            }
            id
            name
            regions {
                id
                name
            }
        }
    }
`;

const CREATE_EXTRACTION = gql`
    mutation CreateExtraction($extraction: CreateExtractInputType!){
        createExtraction(data: $extraction) {
            result {
                id
                name
            }
            errors
        }
    }
`;

const UPDATE_EXTRACTION = gql`
    mutation UpdateExtraction($extraction: UpdateExtractInputType!) {
        updateExtraction(data: $extraction) {
            result {
                id
                name
            }
            errors
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type NewQueryFields = CreateExtractionMutationVariables['extraction'];
type FormType = PurgeNull<PartialForm<WithId<Omit<NewQueryFields, 'figureRoles'> & { figureRoles: string[] }>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        name: [requiredStringCondition],
        regions: [],
        countries: [],
        crises: [],
        figureRoles: [],
        eventAfter: [],
        eventBefore: [],
        figureCategories: [],
        figureTags: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface NewQueryProps {
    id?: string;
    className?: string;
}

function NewQuery(props: NewQueryProps) {
    const {
        id,
        className,
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

    const onClearFilters = useCallback(() => {
        onValueSet(defaultFormValues);
        notify({ children: 'Filters cleared successfully.' });
    }, [onValueSet]);

    const {
        loading: extractionQueryLoading,
        error: extractionDataError,
    } = useQuery<ExtractionForFormQuery, ExtractionForFormQueryVariables>(
        EXTRACTION_QUERY,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { extractionQuery: extraction } = response;
                if (extraction?.regions) {
                    setRegions(extraction.regions);
                }
                if (extraction?.countries) {
                    setCountries(extraction.countries);
                }
                if (extraction?.crises) {
                    setCrises(extraction.crises);
                }
                if (extraction?.figureCategories) {
                    setFigureCategories(extraction.figureCategories);
                }
                if (extraction?.figureTags) {
                    setFigureTags(extraction.figureTags);
                }
                onValueSet(removeNull({
                    ...extraction,
                    regions: extraction?.regions?.map((r) => r.id),
                    countries: extraction?.countries?.map((c) => c.id),
                    crises: extraction?.crises?.map((cr) => cr.id),
                    figureCategories: extraction?.figureCategories?.map((fc) => fc.id),
                    figureTags: extraction?.figureTags?.map((ft) => ft.id),
                }));
            },
        },
    );

    const {
        data,
        loading: queryOptionsLoading,
        error: queryOptionsError,
    } = useQuery<QueryOptionsQuery>(QUERY_OPTIONS);

    const [
        createExtraction,
        { loading: createLoading },
    ] = useMutation<CreateExtractionMutation, CreateExtractionMutationVariables>(
        CREATE_EXTRACTION,
        {
            onCompleted: (response) => {
                const { createExtraction: createExtractionRes } = response;
                if (!createExtractionRes) {
                    return;
                }
                const { errors, result } = createExtractionRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to create extraction query.' });
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Extraction query created successfully!' });
                    onValueSet(defaultFormValues);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to create extraction.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateExtraction,
        { loading: updateLoading },
    ] = useMutation<UpdateExtractionMutation, UpdateExtractionMutationVariables>(
        UPDATE_EXTRACTION,
        {
            onCompleted: (response) => {
                const { updateExtraction: updateExtractionRes } = response;
                if (!updateExtractionRes) {
                    return;
                }
                const { errors, result } = updateExtractionRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to update extraction.' });
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Extraction updated successfully!' });
                    onPristineSet(true);
                    onValueSet(defaultFormValues);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update extraction.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateExtraction({
                variables: {
                    extraction: removeNull(finalValues) as WithId<NewQueryFields>,
                },
            });
        } else {
            createExtraction({
                variables: {
                    extraction: removeNull(finalValues) as NewQueryFields,
                },
            });
        }
    }, [createExtraction, updateExtraction]);

    const loading = createLoading || updateLoading || extractionQueryLoading;
    const errored = !!extractionDataError;
    const disabled = loading || errored;

    const { user } = useContext(DomainContext);
    // TODO: Permission based action on extraction query
    return (
        <form
            className={_cs(className, styles.queryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.multiColumnRow}>
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
            </div>
            <div className={styles.multiColumnRow}>
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
            </div>
            <div className={styles.multiColumnRow}>
                <TextInput
                    label="Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.name}
                />
                <FigureCategoryMultiSelectInput
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
            </div>
            <div className={styles.formButtons}>
                {/* <Button
                    name={undefined}
                    onClick={onClearFilters}
                    className={styles.button}
                    disabled={disabled}
                    icons={<IoIosArchive />}
                >
                    Clear Filters
                </Button> */}
                <QuickActionConfirmButton
                    name={undefined}
                    onConfirm={onClearFilters}
                    title="Clear Filters"
                    disabled={disabled || pristine}
                    className={styles.button}
                >
                    Clear Filters
                </QuickActionConfirmButton>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                    className={styles.button}
                >
                    Generate
                </Button>
            </div>
        </form>
    );
}

export default NewQuery;
