import React, { useContext, useMemo, useCallback } from 'react';
import {
    Switch,
    TextInput,
    NumberInput,
    Button,
    DateRangeDualInput,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { isDefined } from '@togglecorp/fujs';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredStringCondition,
    requiredCondition,
    arrayCondition,
    idCondition,
    nullCondition,
    integerCondition,
    greaterThanOrEqualToCondition,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import useOptions from '#hooks/useOptions';
import NonFieldError from '#components/NonFieldError';
import CrisisMultiSelectInput from '#components/selections/CrisisMultiSelectInput';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import RegionMultiSelectInput from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput from '#components/selections/GeographicMultiSelectInput';
import FigureTagMultiSelectInput from '#components/selections/FigureTagMultiSelectInput';
import EventMultiSelectInput from '#components/selections/EventMultiSelectInput';
import BooleanInput from '#components/selections/BooleanInput';

import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import { transformToFormError } from '#utils/errorTransform';
import {
    isFlowCategory,
    isVisibleCategory,
} from '#utils/selectionConstants';
import Row from '#components/Row';

import {
    enumKeySelector,
    enumLabelSelector,
    basicEntityKeySelector,
    basicEntityLabelSelector,
    WithId,
    GetEnumOptions,
} from '#utils/common';
import {
    BasicEntity,
} from '#types';

import {
    ReportOptionsQuery,
    ReportForFormQuery,
    ReportForFormQueryVariables,
    CreateReportMutation,
    CreateReportMutationVariables,
    UpdateReportMutation,
    UpdateReportMutationVariables,
    Crisis_Type as CrisisType,
    Role,
    Figure_Category_Types as FigureCategoryTypes,
} from '#generated/types';

import styles from './styles.css';

// NOTE: the comparison should be type-safe but
// we are currently downcasting string literals to string
const disaster: CrisisType = 'DISASTER';
const conflict: CrisisType = 'CONFLICT';

const REPORT_OPTIONS = gql`
    query ReportOptions {
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        figureCategoryList: __type(name: "FIGURE_CATEGORY_TYPES") {
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
    }
`;

const REPORT = gql`
    query ReportForForm($id: ID!) {
        report(id: $id) {
            isPublic
            isGiddReport
            giddReportYear
            filterFigureRoles
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
            filterFigureRegions {
                id
                name
            }
            filterFigureGeographicalGroups {
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
            filterFigureTags {
                id
                name
            }
            filterFigureEvents {
                id
                name
            }
            id
            name
            filterFigureCrisisTypes
        }
    }
`;

const CREATE_REPORT = gql`
    mutation CreateReport($report: ReportCreateInputType!) {
        createReport(data: $report) {
            result {
                id
                name
            }
            errors
        }
    }
`;

const UPDATE_REPORT = gql`
    mutation UpdateReport($report: ReportUpdateInputType!) {
        updateReport(data: $report) {
            result {
                id
                name
            }
            errors
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

interface ViolenceOption extends BasicEntity {
    violenceTypeId: string;
    violenceTypeName: string;
}
const violenceGroupKeySelector = (item: ViolenceOption) => (
    item.violenceTypeId
);
const violenceGroupLabelSelector = (item: ViolenceOption) => (
    item.violenceTypeName
);

interface DisasterOption extends BasicEntity {
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

type ReportFormFields = CreateReportMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<ReportFormFields>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (reportValue): FormSchemaFields => {
        let basicFields: FormSchemaFields = {
            id: [idCondition],
            isGiddReport: [],
            name: [requiredStringCondition],
        };
        if (reportValue?.isGiddReport) {
            return {
                ...basicFields,
                giddReportYear: [
                    requiredCondition,
                    integerCondition,
                    greaterThanOrEqualToCondition(2008),
                ],
            };
        }
        basicFields = {
            ...basicFields,
            isPublic: [],
            filterFigureCountries: [arrayCondition],
            filterFigureCrises: [arrayCondition],
            filterFigureCrisisTypes: [arrayCondition],
            filterFigureStartAfter: [requiredStringCondition],
            filterFigureEndBefore: [requiredStringCondition],
            filterFigureCategories: [arrayCondition],
            filterFigureRegions: [arrayCondition],
            filterFigureGeographicalGroups: [arrayCondition],
            filterFigureTags: [arrayCondition],
            filterFigureRoles: [arrayCondition],
            filterFigureEvents: [arrayCondition],

            filterFigureViolenceSubTypes: [nullCondition, arrayCondition],
            filterFigureDisasterSubTypes: [nullCondition, arrayCondition],
        };
        if (reportValue?.filterFigureCrisisTypes?.includes(disaster)) {
            basicFields = {
                ...basicFields,
                filterFigureDisasterSubTypes: [arrayCondition],
            };
        }
        if (reportValue?.filterFigureCrisisTypes?.includes(conflict)) {
            basicFields = {
                ...basicFields,
                filterFigureViolenceSubTypes: [arrayCondition],
            };
        }
        return basicFields;
    },
};

const defaultFormValues: PartialForm<FormType> = {
    filterFigureCountries: [],
    isPublic: false,
    isGiddReport: false,
    filterFigureCrises: [],
    filterFigureCrisisTypes: [],
    filterFigureCategories: [],
    filterFigureRegions: [],
    filterFigureGeographicalGroups: [],
    filterFigureRoles: [],
    filterFigureTags: [],
    filterFigureEvents: [],
    filterFigureViolenceSubTypes: [],
    filterFigureDisasterSubTypes: [],
};

interface ReportFormProps {
    id?: string;
    onReportCreate?: (result: NonNullable<NonNullable<CreateReportMutation['createReport']>['result']>) => void;
    onReportFormCancel: () => void;
}

function ReportForm(props: ReportFormProps) {
    const {
        id,
        onReportCreate,
        onReportFormCancel,
    } = props;

    const [, setCountries] = useOptions('country');
    const [, setCrises] = useOptions('crisis');
    const [, setRegions] = useOptions('region');
    const [, setGeographicGroups] = useOptions('geographicGroup');
    const [, setTags] = useOptions('tag');
    const [, setEventOptions] = useOptions('event');

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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const reportVariables = useMemo(
        (): ReportForFormQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: reportDataLoading,
        error: reportDataError,
    } = useQuery<ReportForFormQuery, ReportForFormQueryVariables>(
        REPORT,
        {
            skip: !reportVariables,
            variables: reportVariables,
            onCompleted: (response) => {
                const { report } = response;

                if (!report) {
                    return;
                }
                if (report.filterFigureCountries) {
                    setCountries(report.filterFigureCountries);
                }
                if (report.filterFigureCrises) {
                    setCrises(report.filterFigureCrises);
                }

                if (report.filterFigureRegions) {
                    setRegions(report.filterFigureRegions);
                }

                if (report.filterFigureGeographicalGroups) {
                    setGeographicGroups(report.filterFigureGeographicalGroups);
                }
                if (report.filterFigureTags) {
                    setTags(report.filterFigureTags);
                }
                if (report.filterFigureEvents) {
                    setEventOptions(report.filterFigureEvents);
                }
                onValueSet(removeNull({
                    ...report,
                    filterFigureCountries: report.filterFigureCountries?.map((c) => c.id),
                    filterFigureCrises: report.filterFigureCrises?.map((cr) => cr.id),
                    filterFigureCategories: report.filterFigureCategories,
                    filterFigureRegions: report.filterFigureRegions?.map((rg) => rg.id),
                    // eslint-disable-next-line max-len
                    filterFigureGeographicalGroups: report.filterFigureGeographicalGroups?.map((geo) => geo.id),
                    filterFigureTags: report.filterFigureTags?.map((tag) => tag.id),
                    filterFigureEvents: report.filterFigureEvents?.map((event) => event.id),
                    filterFigureRoles: report.filterFigureRoles,

                    filterFigureViolenceSubTypes: report.filterFigureViolenceSubTypes?.map(
                        (sub) => sub.id,
                    ),
                    filterFigureDisasterSubTypes: report.filterFigureDisasterSubTypes?.map(
                        (sub) => sub.id,
                    ),
                }));
            },
        },
    );

    const {
        data,
        loading: reportOptionsLoading,
        error: reportOptionsError,
    } = useQuery<ReportOptionsQuery>(REPORT_OPTIONS);

    const [
        createReport,
        { loading: createLoading },
    ] = useMutation<CreateReportMutation, CreateReportMutationVariables>(
        CREATE_REPORT,
        {
            onCompleted: (response) => {
                const { createReport: createReportRes } = response;
                if (!createReportRes) {
                    return;
                }
                const { errors, result } = createReportRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (onReportCreate && result) {
                    notify({
                        children: 'Report created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onReportCreate(result);
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateReport,
        { loading: updateLoading },
    ] = useMutation<UpdateReportMutation, UpdateReportMutationVariables>(
        UPDATE_REPORT,
        {
            onCompleted: (response) => {
                const { updateReport: updateReportRes } = response;
                if (!updateReportRes) {
                    return;
                }
                const { errors, result } = updateReportRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Report updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    if (onReportCreate) {
                        onReportCreate(result);
                    }
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        const sanitizedValues = finalValues?.isGiddReport
            ? {
                ...finalValues,
                isPublic: true,
            } : finalValues;
        if (sanitizedValues.id) {
            updateReport({
                variables: {
                    report: sanitizedValues as WithId<ReportFormFields>,
                },
            });
        } else {
            createReport({
                variables: {
                    report: sanitizedValues as ReportFormFields,
                },
            });
        }
    }, [createReport, updateReport]);

    const violenceOptions = useMemo(
        () => (
            data?.violenceList?.results?.flatMap((violenceType) => (
                violenceType.subTypes?.results?.map((violenceSubType) => ({
                    ...violenceSubType,
                    violenceTypeId: violenceType.id,
                    violenceTypeName: violenceType.name,
                }))
            )).filter(isDefined)
        ),
        [data?.violenceList],
    );

    const disasterSubTypeOptions = useMemo(
        () => (
            data?.disasterCategoryList?.results?.flatMap((disasterCategory) => (
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
            )).filter(isDefined)
        ),
        [data?.disasterCategoryList],
    );

    const conflictType = value.filterFigureCrisisTypes?.includes(conflict);
    const disasterType = value?.filterFigureCrisisTypes?.includes(disaster);

    const loading = createLoading || updateLoading || reportDataLoading;
    const errored = !!reportDataError;
    const disabled = loading || errored;

    const crisisTypes = data?.crisisType?.enumValues;
    type CrisisTypeOptions = GetEnumOptions<
        typeof crisisTypes,
        NonNullable<typeof value.filterFigureCrisisTypes>[number]
    >;

    const figureCategories = data?.figureCategoryList?.enumValues;
    type FigureCategoryOptions = GetEnumOptions<
        typeof figureCategories,
        NonNullable<typeof value.filterFigureCategories>[number]
    >;

    const figureRoles = data?.figureRoleList?.enumValues;
    type FigureRoleOptions = GetEnumOptions<
        typeof figureRoles,
        NonNullable<typeof value.filterFigureRoles>[number]
    >;

    const handleYearChange = useCallback(
        (val: number | undefined, name: 'giddReportYear') => {
            onValueChange(val, name);
            onValueChange(isDefined(val) ? `GRID ${val + 1}` : undefined, 'name');
        },
        [onValueChange],
    );

    return (
        <form
            className={styles.reportForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Switch
                label="This is a GRID report"
                onChange={onValueChange}
                value={value.isGiddReport}
                name="isGiddReport"
                error={error?.fields?.isGiddReport}
                disabled={disabled}
            />
            {value.isGiddReport ? (
                <>
                    <NumberInput
                        label="Year *"
                        value={value.giddReportYear}
                        onChange={handleYearChange}
                        name="giddReportYear"
                        error={error?.fields?.giddReportYear}
                        disabled={disabled}
                    />
                    <TextInput
                        label="Name *"
                        name="name"
                        value={value.name}
                        onChange={onValueChange}
                        error={error?.fields?.name}
                        readOnly
                    />
                </>
            ) : (
                <>
                    <TextInput
                        label="Name *"
                        name="name"
                        value={value.name}
                        onChange={onValueChange}
                        error={error?.fields?.name}
                        disabled={disabled}
                        autoFocus
                    />
                    <Row>
                        <MultiSelectInput<CrisisType, 'filterFigureCrisisTypes', NonNullable<CrisisTypeOptions>[number], { containerClassName?: string }>
                            options={crisisTypes as CrisisTypeOptions}
                            label="Cause"
                            name="filterFigureCrisisTypes"
                            value={value.filterFigureCrisisTypes}
                            onChange={onValueChange}
                            keySelector={enumKeySelector}
                            labelSelector={enumLabelSelector}
                            error={error?.fields?.filterFigureCrisisTypes?.$internal}
                            disabled={disabled || reportOptionsLoading || !!reportOptionsError}
                        />
                        {conflictType && (
                            <MultiSelectInput<string, 'filterFigureViolenceSubTypes', ViolenceOption, { containerClassName?: string }>
                                options={violenceOptions}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Violence Type"
                                name="filterFigureViolenceSubTypes"
                                value={value.filterFigureViolenceSubTypes}
                                onChange={onValueChange}
                                error={error?.fields?.filterFigureViolenceSubTypes?.$internal}
                                groupLabelSelector={violenceGroupLabelSelector}
                                groupKeySelector={violenceGroupKeySelector}
                                grouped
                            />
                        )}
                        {disasterType && (
                            <MultiSelectInput<string, 'filterFigureDisasterSubTypes', DisasterOption, { containerClassName?: string }>
                                options={disasterSubTypeOptions}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Hazard Types"
                                name="filterFigureDisasterSubTypes"
                                value={value.filterFigureDisasterSubTypes}
                                onChange={onValueChange}
                                error={error?.fields?.filterFigureDisasterSubTypes?.$internal}
                                disabled={disabled}
                                groupLabelSelector={disasterGroupLabelSelector}
                                groupKeySelector={disasterGroupKeySelector}
                                grouped
                            />
                        )}
                    </Row>
                    <Row>
                        <CrisisMultiSelectInput
                            label="Crisis"
                            name="filterFigureCrises"
                            error={error?.fields?.filterFigureCrises?.$internal}
                            value={value.filterFigureCrises}
                            onChange={onValueChange}
                            disabled={disabled}
                        />
                        <EventMultiSelectInput
                            label="Events"
                            name="filterFigureEvents"
                            onChange={onValueChange}
                            value={value.filterFigureEvents}
                            error={error?.fields?.filterFigureEvents?.$internal}
                            disabled={disabled}
                        />
                    </Row>
                    <Row>
                        <DateRangeDualInput
                            label="Date Range *"
                            fromName="filterFigureStartAfter"
                            fromValue={value.filterFigureStartAfter}
                            fromOnChange={onValueChange}
                            fromError={error?.fields?.filterFigureStartAfter}
                            toName="filterFigureEndBefore"
                            toOnChange={onValueChange}
                            toValue={value.filterFigureEndBefore}
                            toError={error?.fields?.filterFigureEndBefore}
                            disabled={disabled}
                        />
                        <BooleanInput
                            label="Public"
                            name="isPublic"
                            error={error?.fields?.isPublic}
                            value={value.isPublic}
                            onChange={onValueChange}
                            disabled={disabled}
                        />
                    </Row>
                    <Row>
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
                        <CountryMultiSelectInput
                            label="Countries"
                            name="filterFigureCountries"
                            value={value.filterFigureCountries}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureCountries?.$internal}
                            disabled={disabled}
                        />
                    </Row>
                    <Row>
                        <MultiSelectInput<FigureCategoryTypes, 'filterFigureCategories', NonNullable<FigureCategoryOptions>[number], { containerClassName?: string }>
                            options={figureCategories as FigureCategoryOptions}
                            keySelector={enumKeySelector}
                            labelSelector={enumLabelSelector}
                            label="Categories"
                            name="filterFigureCategories"
                            value={value.filterFigureCategories}
                            onChange={onValueChange}
                            error={error?.fields?.filterFigureCategories?.$internal}
                            disabled={disabled}
                            groupKeySelector={figureCategoryGroupKeySelector}
                            groupLabelSelector={figureCategoryGroupLabelSelector}
                            grouped
                            hideOptionFilter={figureCategoryHideOptionFilter}
                        />
                        <FigureTagMultiSelectInput
                            label="Tags"
                            name="filterFigureTags"
                            error={error?.fields?.filterFigureTags?.$internal}
                            value={value.filterFigureTags}
                            onChange={onValueChange}
                            disabled={disabled}
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
                            disabled={disabled}
                        />
                    </Row>
                </>
            )}
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onReportFormCancel}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default ReportForm;
