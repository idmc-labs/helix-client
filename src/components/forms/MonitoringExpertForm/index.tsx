import React, { useState, useContext, useMemo, useCallback } from 'react';
import {
    SelectInput,
    Button,
    TextInput,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    PurgeNull,
    useForm,
    useFormObject,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredStringCondition,
    Error,
    StateArg,
    useFormArray,
} from '@togglecorp/toggle-form';
import { randomString } from '@togglecorp/fujs';

import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import UserSelectInput, { UserOption } from '#components/selections/UserSelectInput';

import { transformToFormError } from '#utils/errorTransform';

import {
    ManageMonitoringExpertQuery,
    ManageMonitoringExpertQueryVariables,
    CreateOrUpdateMonitoringExpertsMutation,
    CreateOrUpdateMonitoringExpertsMutationVariables,
} from '#generated/types';

import FormContainer from './FormContainer';

const UPDATE_MONITORING_EXPERT = gql`
    mutation CreateOrUpdateMonitoringExperts($data: BulkMonitoringExpertPortfolioInputType!) {
        createMonitoringExpertPortfolio(data: $data) {
            errors
            ok
        }
    }
`;

const CORDINATOR_INFO = gql`
    query manageMonitoringExpert($id: ID!) {
        monitoringSubRegion(id: $id) {
            countries {
              results {
                id
                idmcShortName
                monitoringExpert {
                  user {
                    id
                    fullName
                  }
                }
              }
            }
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type MonitoringExpertFormFields = CreateOrUpdateMonitoringExpertsMutationVariables['data'];
type FormType = PurgeNull<PartialForm<WithId<MonitoringExpertFormFields>>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        region: [requiredStringCondition],
        portfolios: collectionSchema,
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

type CollectionType = NonNullable<NonNullable<FormType['portfolios']>>[number];

type CollectionSchema = ObjectSchema<PartialForm<CollectionType>>;
type CollectionSchemaFields = ReturnType<CollectionSchema['fields']>;
const collectionSchema: CollectionSchema = {
    fields: (): CollectionSchemaFields => ({
        user: [requiredStringCondition],
        country: [],
    }),
};

const defaultCollectionValue: PartialForm<CollectionType> = {};

interface CollectionInputProps {
    value: PartialForm<CollectionType>,
    error: Error<CollectionType> | undefined;
    onChange: (value: StateArg<PartialForm<CollectionType>>, index: number) => void;
    onRemove: (index: number) => void;
    index: number,
}
function CollectionInput(props: CollectionInputProps) {
    const {
        value,
        error,
        onChange,
        onRemove,
        index,
    } = props;

    const onFieldChange = useFormObject(index, onChange, defaultCollectionValue);

    return (
        <>
            <Row>
                <h4>
                    {`Countries #${index + 1}`}
                </h4>
                <Button
                    name={index}
                    onClick={onRemove}
                    transparent
                    title="Remove Country"
                >
                    x
                </Button>
            </Row>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Country *"
                name="country"
                value={value.country}
                onChange={onFieldChange}
                error={error?.fields?.country}
            />
            <TextInput
                label="Monitoring Expert *"
                name="user"
                value={value.user}
                onChange={onFieldChange}
                error={error?.fields?.user}
            />
        </>
    );
}

interface UpdateMonitoringExpertFormProps {
    id?: string;
    onMonitorFormCancel: () => void;
}

function ManageMonitoringExpert(props: UpdateMonitoringExpertFormProps) {
    const {
        id,
        onMonitorFormCancel,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        assignedToOptions,
        setAssignedToOptions,
    ] = useState<UserOption[] | null | undefined>();

    const manageCordinatorVariables = useMemo(
        (): ManageMonitoringExpertQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        data: manageData,
        loading: loadingCordinators,
    } = useQuery<
        ManageMonitoringExpertQuery,
        ManageMonitoringExpertQueryVariables
    >(CORDINATOR_INFO, {
        variables: manageCordinatorVariables,
    });
    console.log('Check MonitoringExpertQuery::>>', manageData?.monitoringSubRegion?.countries);

    const [
        updateMonitoringExpert,
        { loading: monitoringExpertLoading },
    ] = useMutation<
        CreateOrUpdateMonitoringExpertsMutation,
        CreateOrUpdateMonitoringExpertsMutationVariables
    >(
        UPDATE_MONITORING_EXPERT,
        {
            onCompleted: (response) => {
                const { createMonitoringExpertPortfolio: updateExpert } = response;
                if (!updateExpert) {
                    return;
                }
                const { errors, ok } = updateExpert;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (ok) {
                    notify({ children: 'Monitoring Expert updated successfully!' });
                    onPristineSet(true);
                    onMonitorFormCancel();
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const loading = monitoringExpertLoading;
    const disabled = loading;

    const handleSubmit = React.useCallback(
        (finalValues: FormType) => {
            if (finalValues.id) {
                updateMonitoringExpert({
                    variables: {
                        data: finalValues as WithId<MonitoringExpertFormFields>,
                    },
                });
            }
        }, [updateMonitoringExpert],
    );

    type Collections = typeof value.portfolios;

    const {
        onValueChange: onCollectionChange,
        onValueRemove: onCollectionRemove,
    } = useFormArray('portfolios', onValueChange);

    const handleCollectionAdd = useCallback(
        () => {
            const clientId = randomString();
            const newCollection: PartialForm<CollectionType> = {
                clientId,
            };
            onValueChange(
                (oldValue: PartialForm<Collections>) => (
                    [...(oldValue ?? []), newCollection]
                ),
                'portfolios' as const,
            );
        },
        [onValueChange],
    );

    return (

        <FormContainer value={value}>
            <form
                onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            >
                {loading && <Loading absolute />}
                <NonFieldError>
                    {error?.$internal}
                </NonFieldError>
                <TextInput
                    label="Regions *"
                    name="region"
                    value={value.region}
                    onChange={onValueChange}
                    error={error?.fields?.region}
                />
                <Row>
                    <h3>
                        Countries
                    </h3>
                    <Button
                        name={undefined}
                        onClick={handleCollectionAdd}
                        title="Add Countries"
                    >
                        +
                    </Button>
                </Row>
                <p>
                    {error?.fields?.portfolios?.$internal}
                </p>
                {value.portfolios?.length ? (
                    value.portfolios.map((collection, index) => (
                        <CollectionInput
                            key={collection?.user}
                            index={index}
                            value={collection}
                            onChange={onCollectionChange}
                            onRemove={onCollectionRemove}
                            error={error?.fields?.portfolios?.members?.[index]}
                        />
                    ))
                ) : (
                    <div>No collections</div>
                )}
                <Button
                    type="submit"
                    name={undefined}
                    variant="primary"
                    disabled={pristine}
                >
                    Submit
                </Button>
            </form>
        </FormContainer>
    );
}

export default ManageMonitoringExpert;
