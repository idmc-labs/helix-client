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
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import {
    ManageMonitoringExpertQuery,
    ManageMonitoringExpertQueryVariables,
    CreateOrUpdateMonitoringExpertsMutation,
    CreateOrUpdateMonitoringExpertsMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const UPDATE_MONITORING_EXPERT = gql`
    mutation CreateOrUpdateMonitoringExperts($data: BulkMonitoringExpertPortfolioInputType!) {
        createMonitoringExpertPortfolio(data: $data) {
            errors
            ok
        }
    }
`;

const MONITORING_INFO = gql`
    query manageMonitoringExpert($id: ID!) {
        monitoringSubRegion(id: $id) {
            id
            name
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

type CollectionType = NonNullable<NonNullable<FormType['portfolios']>>[number];

type CollectionSchema = ObjectSchema<PartialForm<CollectionType>>;
type CollectionSchemaFields = ReturnType<CollectionSchema['fields']>;
const collectionSchema: CollectionSchema = {
    fields: (): CollectionSchemaFields => ({
        user: [requiredStringCondition],
        country: [requiredStringCondition],
    }),
};

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        region: [requiredStringCondition],
        portfolios: collectionSchema,
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface CollectionInputProps {
    value: PartialForm<CollectionType>,
    error: Error<CollectionType> | undefined;
    index: number,
    countryList: CountryListOption[] | null | undefined,
    assignedToOptions: UserOption[] | null | undefined,
    setAssignedToOptions: UserOption[] | null | undefined,
}

function CollectionInput(props: CollectionInputProps) {
    const {
        value,
        error,
        index,
        countryList,
        assignedToOptions,
        setAssignedToOptions,
    } = props;

    const {
        pristine,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    return (
        <>
            <Row>
                <h4>
                    {`Countries #${index + 1}`}
                </h4>
            </Row>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <SelectInput
                    options={countryList}
                    label="Country*"
                    name="country"
                    value={value.country}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    readOnly
                />
                <UserSelectInput
                    options={assignedToOptions}
                    label="Monitoring Expert*"
                    name="user"
                    value={value.user}
                    onChange={onValueChange}
                    onOptionsChange={setAssignedToOptions}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    error={error?.$internal}
                />
            </Row>
        </>
    );
}

interface UpdateMonitoringExpertFormProps {
    id?: string;
    onMonitorFormCancel: () => void;
}

interface RegionOption {
    id: string | undefined;
    name: string;
}

interface CountryListOption {
    id: string;
    name: string;
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
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        regionList,
        setRegionList,
    ] = useState<RegionOption[] | null | undefined>();

    const [
        assignedToOptions,
        setAssignedToOptions,
    ] = useState<UserOption[] | null | undefined>();

    const [
        countryList,
        setCountryList,
    ] = useState<CountryListOption[] | null | undefined>();

    const manageMonitoringExpertVariables = useMemo(
        (): ManageMonitoringExpertQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: loadingCordinators,
    } = useQuery<
        ManageMonitoringExpertQuery,
        ManageMonitoringExpertQueryVariables
    >(MONITORING_INFO, {
        skip: !manageMonitoringExpertVariables,
        variables: manageMonitoringExpertVariables,
        onCompleted: (response) => {
            const { monitoringSubRegion } = response;
            if (monitoringSubRegion) {
                setRegionList([{ id: monitoringSubRegion.id, name: monitoringSubRegion.name }]);
                onValueSet({
                    region: monitoringSubRegion.id,
                    portfolios: monitoringSubRegion?.countries?.results?.map(
                        (countryInfo) => (
                            {
                                user: countryInfo.monitoringExpert?.user.fullName,
                                country: countryInfo.idmcShortName,
                            }
                        ),
                    ),
                });
                if (monitoringSubRegion.countries?.results?.length !== 0) {
                    const assignedUsers = monitoringSubRegion.countries?.results?.map(
                        (countryInfo) => (
                            {
                                id: countryInfo.monitoringExpert?.user?.id,
                                fullName: countryInfo.monitoringExpert?.user?.fullName,
                            }
                        ),
                    );
                    const countries = monitoringSubRegion.countries?.results?.map(
                        (countryInfo) => (
                            {
                                id: countryInfo.id,
                                name: countryInfo.idmcShortName,
                            }
                        ),
                    );
                    setAssignedToOptions(assignedUsers);
                    setCountryList(countries);
                }
            }
        },
    });

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
    const disabled = loading || loadingCordinators;

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

    const {
        onValueChange: onCollectionChange,
    } = useFormArray('portfolios', onValueChange);

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <SelectInput
                    options={regionList}
                    label="Region Name*"
                    name="region"
                    value={value.region}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    readOnly
                />
            </Row>
            <Row>
                <h3>
                    Countries
                </h3>
            </Row>

            <NonFieldError>
                {error?.fields?.portfolios?.$internal}
            </NonFieldError>
            {value.portfolios?.length ? (
                value.portfolios.map((collection, index) => (
                    <CollectionInput
                        key={collection?.user}
                        index={index}
                        value={collection}
                        onChange={onCollectionChange}
                        error={error?.fields?.portfolios?.members?.[index]}
                        countryList={countryList}
                        assignedToOptions={assignedToOptions}
                        setAssignedToOptions={setAssignedToOptions}
                    />
                ))
            ) : (
                <div className={styles.collectionMessage}>
                    No collections
                </div>
            )}
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onMonitorFormCancel}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    className={styles.button}
                    type="submit"
                    name={undefined}
                    variant="primary"
                    disabled={pristine}
                >
                    Save
                </Button>
            </div>
        </form>
    );
}

export default ManageMonitoringExpert;
