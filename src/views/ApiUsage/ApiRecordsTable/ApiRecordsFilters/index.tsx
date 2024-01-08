import React, { useCallback, useEffect } from 'react';
import {
    Button,
    MultiSelectInput,
    DateRangeDualInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import { gql, useQuery } from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import ClientMultiSelectInput from '#components/selections/ClientMultiSelectInput';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    ClientTrackInformationListQueryVariables,
    ApiTypeForFiltersQuery,
} from '#generated/types';
import styles from './styles.css';

const API_TYPE_OPTIONS = gql`
    query ApiTypeForFilters {
        apiType: __type(name: "ExternalApiType") {
            enumValues {
                name
                description
            }
        }
    }
`;

type ApiFilterFields = NonNullable<ClientTrackInformationListQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<ApiFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        apiType: [],
        clientCodes: [],
        startTrackDate: [],
        endTrackDate: [],
    }),
};

interface ApiFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
}

function ApiRecordsFilter(props: ApiFilterProps) {
    const {
        className,
        initialFilter,
        onFilterChange,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(initialFilter, schema);
    // NOTE: Set the form value when initialFilter is changed on parent
    useEffect(
        () => {
            onValueSet(initialFilter);
        },
        [initialFilter, onValueSet],
    );

    const {
        data: apiTypeData,
        loading: apiOptionsLoading,
        error: apiOptionsError,
    } = useQuery<ApiTypeForFiltersQuery>(API_TYPE_OPTIONS);

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFilter);
            onFilterChange(initialFilter);
        },
        [onValueSet, onFilterChange, initialFilter],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

    const filterChanged = initialFilter !== value;

    return (
        <form
            className={_cs(className, styles.queryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.contentContainer}>
                <MultiSelectInput
                    className={styles.input}
                    options={apiTypeData?.apiType?.enumValues}
                    label="API"
                    name="apiType"
                    value={value.apiType}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.apiType?.$internal}
                    disabled={apiOptionsLoading || !!apiOptionsError}
                />
                <ClientMultiSelectInput
                    className={styles.input}
                    label="Client"
                    name="clientCodes"
                    value={value.clientCodes}
                    onChange={onValueChange}
                    error={error?.fields?.clientCodes?.$internal}
                />
                <DateRangeDualInput
                    className={styles.input}
                    label="Date Range"
                    fromName="startTrackDate"
                    fromValue={value.startTrackDate}
                    fromOnChange={onValueChange}
                    fromError={error?.fields?.startTrackDate}
                    toName="endTrackDate"
                    toValue={value.endTrackDate}
                    toOnChange={onValueChange}
                    toError={error?.fields?.endTrackDate}
                />
                <div className={styles.formButtons}>
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
                        disabled={pristine}
                        variant="primary"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default ApiRecordsFilter;
