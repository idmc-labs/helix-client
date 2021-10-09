import React, { useState, useContext, useMemo } from 'react';
import {
    TextInput,
    Button,
    DateInput,
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
    arrayCondition,
    idCondition,
    nullCondition,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import CrisisMultiSelectInput, { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';
import GeographicMultiSelectInput, { GeographicOption } from '#components/selections/GeographicMultiSelectInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import EventMultiSelectInput, { EventOption } from '#components/selections/EventMultiSelectInput';

import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import { transformToFormError } from '#utils/errorTransform';
import Row from '#components/Row';

import {
    enumKeySelector,
    enumLabelSelector,
    basicEntityKeySelector,
    basicEntityLabelSelector,
    EnumFix,
    WithId,
} from '#utils/common';

import {
    ReportOptionsQuery,
    ReportForFormQuery,
    ReportForFormQueryVariables,
    CreateReportMutation,
    CreateReportMutationVariables,
    UpdateReportMutation,
    UpdateReportMutationVariables,
    Crisis_Type as CrisisType,
} from '#generated/types';

import styles from './styles.css';

// FIXME: the comparision should be type-safe but
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
        figureCategoryList {
            results {
                id
                name
                type
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
            filterFigureCountries {
                id
                idmcShortName
            }
            filterEventCrises {
                id
                name
            }
            filterFigureStartAfter
            filterFigureEndBefore
            filterFigureCategories {
              id
              name
            }
            filterFigureRegions {
                id
                name
            }
            filterFigureGeographicalGroups {
                id
                name
            }
            filterEventDisasterSubTypes {
                id
                name
            }
            filterEventViolenceSubTypes {
                id
                name
            }
            filterFigureTags {
                id
                name
            }
            filterEvents {
                id
                name
            }
            id
            name
            filterEventCrisisTypes
        }
    }
`;

const CREATE_REPORT = gql`
    mutation CreateReport($report: ReportCreateInputType!){
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

interface Category {
    id: string;
    name: string;
    type: string;
}

const keySelector = (item: Category) => item.id;
const labelSelector = (item: Category) => item.name;
const groupKeySelector = (item: Category) => item.type;
const groupLabelSelector = (item: Category) => item.type;

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

type ReportFormFields = CreateReportMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<EnumFix<ReportFormFields, 'filterEventCrisisTypes'>>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (reportValue): FormSchemaFields => {
        const basicFields: FormSchemaFields = {
            id: [idCondition],
            name: [requiredStringCondition],
            filterFigureCountries: [arrayCondition],
            filterEventCrises: [arrayCondition],
            filterEventCrisisTypes: [arrayCondition],
            filterFigureStartAfter: [requiredStringCondition],
            filterFigureEndBefore: [requiredStringCondition],
            filterFigureCategories: [arrayCondition],
            filterFigureRegions: [arrayCondition],
            filterFigureGeographicalGroups: [arrayCondition],
            filterFigureTags: [arrayCondition],
            filterEvents: [arrayCondition],

            filterEventViolenceSubTypes: [nullCondition, arrayCondition],
            filterEventDisasterSubTypes: [nullCondition, arrayCondition],
        };
        if (reportValue?.filterEventCrisisTypes?.includes(disaster)) {
            return {
                ...basicFields,
                filterEventDisasterSubTypes: [arrayCondition],
            };
        }
        if (reportValue?.filterEventCrisisTypes?.includes(conflict)) {
            return {
                ...basicFields,
                filterEventViolenceSubTypes: [arrayCondition],
            };
        }
        return basicFields;
    },
};

const defaultFormValues: PartialForm<FormType> = {
    filterFigureCountries: [],
    filterEventCrises: [],
    filterEventCrisisTypes: [],
    filterFigureCategories: [],
    filterFigureRegions: [],
    filterFigureGeographicalGroups: [],
    filterFigureTags: [],
    filterEvents: [],
    filterEventViolenceSubTypes: [],
    filterEventDisasterSubTypes: [],
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

    const [
        filterFigureCountries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        filterEventCrises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>();

    const [filterFigureRegions, setRegions] = useState<RegionOption[] | null | undefined>();
    const [
        filterFigureGeographicalGroups,
        setGeographicGroups,
    ] = useState<GeographicOption[] | null | undefined>();
    const [
        entryTags,
        setTags,
    ] = useState<FigureTagOption[] | null | undefined>();
    const [
        eventOptions,
        setEventOptions,
    ] = useState<EventOption[] | undefined | null>();

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
                if (report.filterEventCrises) {
                    setCrises(report.filterEventCrises);
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
                if (report.filterEvents) {
                    setEventOptions(report.filterEvents);
                }
                onValueSet(removeNull({
                    ...report,
                    filterFigureCountries: report.filterFigureCountries?.map((c) => c.id),
                    filterEventCrises: report.filterEventCrises?.map((cr) => cr.id),
                    filterFigureCategories: report.filterFigureCategories?.map((fc) => fc.id),
                    filterFigureRegions: report.filterFigureRegions?.map((rg) => rg.id),
                    // eslint-disable-next-line max-len
                    filterFigureGeographicalGroups: report.filterFigureGeographicalGroups?.map((geo) => geo.id),
                    filterFigureTags: report.filterFigureTags?.map((tag) => tag.id),
                    filterEvents: report.filterEvents?.map((event) => event.id),

                    filterEventViolenceSubTypes: report.filterEventViolenceSubTypes?.map(
                        (sub) => sub.id,
                    ),
                    filterEventDisasterSubTypes: report.filterEventDisasterSubTypes?.map(
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
                    console.log(formError);
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

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateReport({
                variables: {
                    report: finalValues as WithId<ReportFormFields>,
                },
            });
        } else {
            createReport({
                variables: {
                    report: finalValues as ReportFormFields,
                },
            });
        }
    }, [createReport, updateReport]);

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

    const conflictType = value.filterEventCrisisTypes?.includes(conflict);
    const disasterType = value?.filterEventCrisisTypes?.includes(disaster);

    const loading = createLoading || updateLoading || reportDataLoading;
    const errored = !!reportDataError;
    const disabled = loading || errored;

    return (
        <form
            className={styles.reportForm}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <TextInput
                    label="Name *"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <MultiSelectInput
                    options={data?.crisisType?.enumValues}
                    label="Cause"
                    name="filterEventCrisisTypes"
                    value={value.filterEventCrisisTypes}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterEventCrisisTypes?.$internal}
                    disabled={disabled || reportOptionsLoading || !!reportOptionsError}
                />
                {conflictType && (
                    <MultiSelectInput
                        className={styles.input}
                        options={violenceOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Violence Type"
                        name="filterEventViolenceSubTypes"
                        value={value.filterEventViolenceSubTypes}
                        onChange={onValueChange}
                        error={error?.fields?.filterEventViolenceSubTypes?.$internal}
                        groupLabelSelector={violenceGroupLabelSelector}
                        groupKeySelector={violenceGroupKeySelector}
                        grouped
                    />
                )}
                {disasterType && (
                    <MultiSelectInput
                        options={disasterSubTypeOptions}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        label="Disaster Type"
                        name="filterEventDisasterSubTypes"
                        value={value.filterEventDisasterSubTypes}
                        onChange={onValueChange}
                        error={error?.fields?.filterEventDisasterSubTypes?.$internal}
                        disabled={disabled}
                        groupLabelSelector={disasterGroupLabelSelector}
                        groupKeySelector={disasterGroupKeySelector}
                        grouped
                    />
                )}
            </Row>
            <Row>
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
            <Row>
                <DateInput
                    label="Start Date *"
                    name="filterFigureStartAfter"
                    value={value.filterFigureStartAfter}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.filterFigureStartAfter}
                />
                <DateInput
                    label="End Date *"
                    name="filterFigureEndBefore"
                    value={value.filterFigureEndBefore}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.filterFigureEndBefore}
                />
            </Row>
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
            </Row>
            <Row>
                <MultiSelectInput
                    options={data?.figureCategoryList?.results}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    label="Figure Category"
                    name="filterFigureCategories"
                    value={value.filterFigureCategories}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCategories?.$internal}
                    disabled={disabled}
                    groupLabelSelector={groupLabelSelector}
                    groupKeySelector={groupKeySelector}
                    grouped
                />
                <FigureTagMultiSelectInput
                    options={entryTags}
                    label="Figure Tags"
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
                    onClick={onReportFormCancel}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                    className={styles.button}
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default ReportForm;
