import React, { useCallback } from 'react';
import {
    Button,
    MultiSelectInput,
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
import {
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    ClientTrackInformationListQueryVariables,
    ApiTypeForFiltersQuery,
    ClientListQuery,
} from '#generated/types';
import styles from './styles.css';

const clientCodeSelector = <T extends { code: string }>(d: T) => d.code;

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

const GET_CLIENT_CODE_OPTIONS = gql`
    query ClientList {
        clientList {
            results {
                id
                code
                name
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
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    apiType: undefined,
    clientCodes: undefined,
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

    const {
        data: apiTypeData,
        loading: apiOptionsLoading,
        error: apiOptionsError,
    } = useQuery<ApiTypeForFiltersQuery>(API_TYPE_OPTIONS);

    const {
        data: clientOptionsData,
        loading: clientOptionsLoading,
        error: clientOptionsError,
    } = useQuery<ClientListQuery>(GET_CLIENT_CODE_OPTIONS);

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
                    label="API Type"
                    name="apiType"
                    value={value.apiType}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.apiType?.$internal}
                    disabled={apiOptionsLoading || !!apiOptionsError}
                />
                <MultiSelectInput
                    label="Client Codes"
                    name="clientCodes"
                    options={clientOptionsData?.clientList?.results}
                    value={value.clientCodes}
                    onChange={onValueChange}
                    keySelector={clientCodeSelector}
                    labelSelector={basicEntityLabelSelector}
                    error={error?.fields?.clientCodes?.$internal}
                    disabled={clientOptionsLoading || !!clientOptionsError}
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
