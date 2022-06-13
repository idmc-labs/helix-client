import React, { useState, useContext, useMemo, useCallback } from 'react';
import {
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import { isDefined } from '@togglecorp/fujs';
import {
    PartialForm,
    PurgeNull,
    useForm,
    useFormObject,
    ObjectSchema,
    ArraySchema,
    createSubmitHandler,
    removeNull,
    requiredCondition,
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
    CreateMonitoringExpertsMutation,
    CreateMonitoringExpertsMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const UPDATE_MONITORING_EXPERT = gql`
    mutation CreateMonitoringExperts($data: BulkMonitoringExpertPortfolioInputType!) {
        createMonitoringExpertPortfolio(data: $data) {
            errors
            ok
            result {
                id
                monitoringExpertsCount
            }
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

type MonitoringExpertFormFields = CreateMonitoringExpertsMutationVariables['data'];
type FormType = PurgeNull<PartialForm<MonitoringExpertFormFields, { country: string }>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

type PortfolioType = NonNullable<NonNullable<FormType['portfolios']>>[number];

type PortfolioSchema = ObjectSchema<PartialForm<PortfolioType, { country: string }>>;
type PortfolioSchemaFields = ReturnType<PortfolioSchema['fields']>;
const portfolioSchema: PortfolioSchema = {
    fields: (): PortfolioSchemaFields => ({
        user: [requiredCondition],
        country: [requiredCondition],
    }),
};

type PortfoliosSchema = ArraySchema<PartialForm<PortfolioType, { country: string }>>;
type PortfoliosSchemaMember = ReturnType<PortfoliosSchema['member']>;
const portfoliosSchema: PortfoliosSchema = {
    keySelector: (item) => item.country,
    member: (): PortfoliosSchemaMember => portfolioSchema,
};

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        region: [requiredCondition],
        portfolios: portfoliosSchema,
    }),
};

const defaultFormValues: PartialForm<FormType, { country: string }> = {};

interface PortfolioInputProps {
    index: number,
    value: PartialForm<PortfolioType, { country: string }>,
    error: Error<PortfolioType> | undefined;
    onChange: (
        value: StateArg<PartialForm<PortfolioType, { country: string }>>, index: number
    ) => void;
    countryList: CountryListOption[] | null | undefined,
    assignedToOptions: UserOption[] | null | undefined,
    setAssignedToOptions: React.Dispatch<React.SetStateAction<UserOption[] | null | undefined>>,
}

const defaultCollectionValue: PartialForm<PortfolioType, { country: string }> = {
    country: '0',
};

interface RegionOption {
    id: string;
    name: string;
}

interface CountryListOption {
    id: string;
    name: string;
}

function PortfolioInput(props: PortfolioInputProps) {
    const {
        value,
        error,
        index,
        countryList,
        assignedToOptions,
        setAssignedToOptions,
        onChange,
    } = props;
    const onValueChange = useFormObject(index, onChange, defaultCollectionValue);

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <SelectInput
                    options={countryList}
                    label="Country *"
                    name="country"
                    value={value.country}
                    error={error?.fields?.country}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    nonClearable
                    readOnly
                />
                <UserSelectInput
                    options={assignedToOptions}
                    label="Monitoring Expert *"
                    name="user"
                    value={value.user}
                    onChange={onValueChange}
                    onOptionsChange={setAssignedToOptions}
                    error={error?.fields?.user}
                />
            </Row>
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
        loading: loadingCoordinators,
    } = useQuery<
        ManageMonitoringExpertQuery,
        ManageMonitoringExpertQueryVariables
    >(MONITORING_INFO, {
        skip: !manageMonitoringExpertVariables,
        variables: manageMonitoringExpertVariables,
        onCompleted: (response) => {
            const { monitoringSubRegion } = response;
            if (!monitoringSubRegion) {
                return;
            }

            setRegionList([
                { id: monitoringSubRegion.id, name: monitoringSubRegion.name },
            ]);

            onValueSet({
                region: monitoringSubRegion.id,
                portfolios: monitoringSubRegion?.countries?.results?.map(
                    (countryInfo) => (
                        {
                            user: countryInfo.monitoringExpert?.user.id,
                            country: countryInfo.id,
                        }
                    ),
                ),
            });

            const assignedUsers = monitoringSubRegion.countries?.results?.map(
                (countryInfo) => countryInfo.monitoringExpert?.user,
            ).filter(isDefined);
            setAssignedToOptions(assignedUsers);

            const countries = monitoringSubRegion.countries?.results?.map(
                (countryInfo) => ({
                    id: countryInfo.id,
                    name: countryInfo.idmcShortName,
                }),
            );
            setCountryList(countries);
        },
    });

    const [
        updateMonitoringExpert,
        { loading: monitoringExpertLoading },
    ] = useMutation<
        CreateMonitoringExpertsMutation,
        CreateMonitoringExpertsMutationVariables
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
                    notify({
                        children: 'Monitoring Expert updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onMonitorFormCancel();
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

    const loading = monitoringExpertLoading;
    const disabled = loading || loadingCoordinators;

    const handleSubmit = useCallback(
        (finalValues: FormType) => {
            updateMonitoringExpert({
                variables: {
                    data: finalValues as MonitoringExpertFormFields,
                },
            });
        },
        [updateMonitoringExpert],
    );

    const {
        onValueChange: onPortfolioChange,
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
            <SelectInput
                options={regionList}
                label="Region *"
                name="region"
                value={value.region}
                error={error?.fields?.region}
                onChange={onValueChange}
                keySelector={basicEntityKeySelector}
                labelSelector={basicEntityLabelSelector}
                readOnly
            />
            <NonFieldError>
                {error?.fields?.portfolios?.$internal}
            </NonFieldError>
            {value.portfolios?.map((portfolio, index) => (
                <PortfolioInput
                    key={portfolio?.country}
                    index={index}
                    value={portfolio}
                    onChange={onPortfolioChange}
                    error={error?.fields?.portfolios?.members?.[portfolio.country]}
                    countryList={countryList}
                    assignedToOptions={assignedToOptions}
                    setAssignedToOptions={setAssignedToOptions}
                />
            ))}
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
