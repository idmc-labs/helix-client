import React, { useState, useCallback } from 'react';
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
import ClientMultiSelectInput, { ClientCodeOption } from '#components/selections/ClientMultiSelectInput';

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

// eslint-disable-next-line @typescript-eslint/ban-types
type ApiFilterFields = Omit<ClientTrackInformationListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
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

const defaultFormValues: PartialForm<FormType> = {
    apiType: undefined,
    clientCodes: undefined,
    startTrackDate: undefined,
    endTrackDate: undefined,
};

interface ApiFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<ClientTrackInformationListQueryVariables>) => void;
}

function ApiRecordsFilter(props: ApiFilterProps) {
    const {
        className,
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
    } = useForm(defaultFormValues, schema);

    const [
        clientCodeOptions,
        setClientCodeOptions,
    ] = useState<ClientCodeOption[] | undefined | null>();

    const {
        data: apiTypeData,
        loading: apiOptionsLoading,
        error: apiOptionsError,
    } = useQuery<ApiTypeForFiltersQuery>(API_TYPE_OPTIONS);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

    const filterChanged = defaultFormValues !== value;

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
                    options={clientCodeOptions}
                    onOptionsChange={setClientCodeOptions}
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
