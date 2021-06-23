import React, { useState, useContext, useMemo } from 'react';
import {
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    removeNull,
    requiredStringCondition,
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
        country: [],
        user: [],
        region: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

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
                    className={styles.input}
                    options={null}
                    label="Region Name*"
                    name="region"
                    value={value.region}
                    onChange={onValueChange}
                />
            </Row>
            <Row singleColumnNoGrow>
                <SelectInput
                    className={styles.input}
                    label="Country*"
                    options={null}
                    name="country"
                    value={value.country}
                    onChange={onValueChange}
                />

                <UserSelectInput
                    name="user"
                    label="Monitoring Expert*"
                    onChange={onValueChange}
                    value={value.user}
                    disabled={disabled}
                    options={assignedToOptions}
                    onOptionsChange={setAssignedToOptions}
                    error={error?.$internal}
                />
            </Row>

            <Row singleColumnNoGrow>
                <SelectInput
                    className={styles.input}
                    label="Country*"
                    options={null}
                    name="country"
                    value={value.country}
                    onChange={onValueChange}
                />

                <UserSelectInput
                    name="user"
                    label="Monitoring Expert*"
                    onChange={onValueChange}
                    value={value.user}
                    disabled={disabled}
                    options={assignedToOptions}
                    onOptionsChange={setAssignedToOptions}
                    error={error?.$internal}
                />
            </Row>

            <Row singleColumnNoGrow>
                <SelectInput
                    className={styles.input}
                    label="Country*"
                    options={null}
                    name="country"
                    value={value.country}
                    onChange={onValueChange}
                />

                <UserSelectInput
                    name="user"
                    label="Monitoring Expert*"
                    onChange={onValueChange}
                    value={value.user}
                    disabled={disabled}
                    options={assignedToOptions}
                    onOptionsChange={setAssignedToOptions}
                    error={error?.$internal}
                />
            </Row>

            <Row singleColumnNoGrow>
                <SelectInput
                    className={styles.input}
                    label="Country*"
                    options={null}
                    name="country"
                    value={value.country}
                    onChange={onValueChange}
                />

                <UserSelectInput
                    name="user"
                    label="Monitoring Expert*"
                    onChange={onValueChange}
                    value={value.user}
                    disabled={disabled}
                    options={assignedToOptions}
                    onOptionsChange={setAssignedToOptions}
                    error={error?.$internal}
                />
            </Row>
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
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    className={styles.button}
                    variant="primary"
                >
                    Save
                </Button>
            </div>
        </form>
    );
}

export default ManageMonitoringExpert;
