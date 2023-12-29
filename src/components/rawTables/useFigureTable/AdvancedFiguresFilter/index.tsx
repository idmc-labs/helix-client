import React, { useState, useContext, useCallback, useMemo } from 'react';
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
    removeNull,
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
import useOptions from '#hooks/useOptions';

import Container from '#components/Container';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
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
    ExtractionForFormQuery,
    ExtractionForFormQueryVariables,
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
            filterFigureCreatedBy {
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
            filterFigureContextOfViolence {
                id
                name
            }
            filterFigureDisasterSubTypes {
                id
                name
            }
            filterFigureViolenceSubTypes {
                id
                name
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

// FIXME: the comparison should be type-safe but
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

type AdvancedFigureFiltersFields = Omit<ExtractionEntryListFiltersQueryVariables, 'ordering' | 'page' | 'pageSize'>;
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
    filterFigureCreatedBy: [],
    filterFigureEvents: [],
    filterFigureReviewStatus: [],
    filterFigureHasExcerptIdu: undefined,
    filterFigureHasHousingDestruction: undefined,
};

// FIXME: move extraction query fetch logic outside this component
interface AdvancedFigureFiltersProps {
    id?: string;
    className?: string;
    onFilterChange: React.Dispatch<React.SetStateAction<
        ExtractionEntryListFiltersQueryVariables | undefined
    >>;
    onFilterMetaChange: React.Dispatch<React.SetStateAction<
        { name?: string, id?: string }
    >>;
}

function AdvancedFigureFilters(props: AdvancedFigureFiltersProps) {
    const {
        id,
        className,
        onFilterChange,
        onFilterMetaChange,
    } = props;

    const [, setCountries] = useOptions('country');
    const [, setCreatedByOptions] = useOptions('user');
    const [, setRegions] = useOptions('region');
    const [, setGeographicGroups] = useOptions('geographicGroup');
    const [, setCrises] = useOptions('crisis');
    const [, setTags] = useOptions('tag');
    const [, setOrganizations] = useOptions('organization');
    const [, setEventOptions] = useOptions('event');
    const [, setViolenceContextOptions] = useOptions('contextOfViolence');

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
                    setOrganizations(otherAttrs.filterFigureSources);
                }
                if (otherAttrs.filterEntryPublishers) {
                    setOrganizations(otherAttrs.filterEntryPublishers);
                }
                if (otherAttrs.filterFigureEvents) {
                    setEventOptions(otherAttrs.filterFigureEvents);
                }
                if (otherAttrs.filterFigureCreatedBy) {
                    setCreatedByOptions(otherAttrs.filterFigureCreatedBy);
                }
                if (otherAttrs.filterFigureContextOfViolence) {
                    setViolenceContextOptions(otherAttrs.filterFigureContextOfViolence);
                }
                const formValue = removeNull({
                    filterFigureRegions: otherAttrs.filterFigureRegions?.map((r) => r.id),
                    filterFigureGeographicalGroups: otherAttrs.filterFigureGeographicalGroups
                        ?.map((r) => r.id),
                    filterFigureCreatedBy: otherAttrs.filterFigureCreatedBy?.map((u) => u.id),
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
                    // eslint-disable-next-line max-len
                    filterFigureContextOfViolence: otherAttrs.filterFigureContextOfViolence?.map((e) => e.id),
                    // eslint-disable-next-line max-len
                    filterFigureDisasterSubTypes: otherAttrs.filterFigureDisasterSubTypes?.map((e) => e.id),
                    // eslint-disable-next-line max-len
                    filterFigureViolenceSubTypes: otherAttrs.filterFigureViolenceSubTypes?.map((e) => e.id),
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

    const loading = extractionQueryLoading;
    const errored = !!extractionDataError;
    const disabled = loading || errored;

    const filterChanged = initialFormValues !== value;

    const conflictType = value.filterFigureCrisisTypes?.includes(conflict);
    const disasterType = value.filterFigureCrisisTypes?.includes(disaster);

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
                        <CrisisMultiSelectInput
                            label="Crises"
                            name="filterFigureCrises"
                            error={error?.fields?.filterFigureCrises?.$internal}
                            value={value.filterFigureCrises}
                            onChange={onValueChange}
                            disabled={disabled}
                            // countries={value.filterFigureCountries}
                        />
                        <EventMultiSelectInput
                            label="Events"
                            name="filterFigureEvents"
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
            </Container>
        </form>
    );
}

export default AdvancedFigureFilters;
