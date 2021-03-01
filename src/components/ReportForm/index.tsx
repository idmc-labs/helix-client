import React, { useState, useContext } from 'react';
import {
    TextInput,
    Button,
    DateInput,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import CrisisMultiSelectInput, { CrisisOption } from '#components/CrisisMultiSelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/CountryMultiSelectInput';
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
    ReportOptionsQuery,
    ReportForFormQuery,
    ReportForFormQueryVariables,
    CreateReportMutation,
    CreateReportMutationVariables,
    UpdateReportMutation,
    UpdateReportMutationVariables,
} from '#generated/types';
import styles from './styles.css';

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
    }
`;

const REPORT = gql`
    query ReportForForm($id: ID!) {
        report(id: $id) {
            eventCountries {
                id
                name
            }
            eventCrises {
                id
                name
            }
            figureStartAfter
            figureEndBefore
            figureCategories {
              id
              name
            }
            id
            name
            eventCrisisTypes
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

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ReportFormFields = CreateReportMutationVariables['report'];
type FormType = PurgeNull<PartialForm<WithId<Omit<ReportFormFields, 'eventCrisisTypes'> & { eventCrisisTypes: string[] }>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        name: [requiredStringCondition],
        eventCountries: [],
        eventCrises: [],
        eventCrisisTypes: [],

        figureStartAfter: [requiredStringCondition],
        figureEndBefore: [requiredStringCondition],
        figureCategories: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    eventCountries: [],
    eventCrises: [],
    eventCrisisTypes: [],
    figureCategories: [],
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
        eventCountries,
        setCountries,
    ] = useState<CountryOption[] | null | undefined>();
    const [
        eventCrises,
        setCrises,
    ] = useState<CrisisOption[] | null | undefined>();

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

    const {
        loading: reportDataLoading,
        error: reportDataError,
    } = useQuery<ReportForFormQuery, ReportForFormQueryVariables>(
        REPORT,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { report } = response;
                if (!report) {
                    return;
                }
                if (report.eventCountries) {
                    setCountries(report.eventCountries);
                }
                if (report.eventCrises) {
                    setCrises(report.eventCrises);
                }

                onValueSet(removeNull({
                    ...report,
                    eventCountries: report.eventCountries?.map((c) => c.id),
                    eventCrises: report.eventCrises?.map((cr) => cr.id),
                    figureCategories: report.figureCategories?.map((fc) => fc.id),
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
                    notify({ children: 'Failed to create report.' });
                    onErrorSet(formError);
                }
                if (onReportCreate && result) {
                    notify({ children: 'Report created successfully!' });
                    onPristineSet(true);
                    onReportCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to create report.' });
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
                    notify({ children: 'Failed to update report.' });
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Report updated successfully!' });
                    onPristineSet(true);
                    if (onReportCreate) {
                        onReportCreate(result);
                    }
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update report.' });
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
            <TextInput
                label="Name *"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
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
                disabled={disabled || reportOptionsLoading || !!reportOptionsError}
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
