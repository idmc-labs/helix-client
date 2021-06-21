import React, { useState, useContext, useMemo } from 'react';

import {
    TextInput,
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
import ReviewersMultiSelectInput, { UserOption } from '#components/selections/ReviewersMultiSelectInput';
import RegionMultiSelectInput, { RegionOption } from '#components/selections/RegionMultiSelectInput';

import { transformToFormError } from '#utils/errorTransform';

import {
    ManageCordinatorQuery,
    ManageCordinatorQueryVariables,
    UpdateRegionalCoordinatorMutation,
    UpdateRegionalCoordinatorMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const UPDATE_REGIONAL_CORDINATOR = gql`
    mutation updateRegionalCoordinator($data: RegionalCoordinatorPortfolioInputType!, $id: ID!) {
        updateRegionalCoordinatorPortfolio(data: $data, id: $id) {
            errors
            ok
        }
    }
`;

const MANAGE_CORDINATOR = gql`
    query manageCordinator($id: Float) {
        monitoringSubRegionList(id: $id) {
            results {
              id
              countries {
                results {
                  id
                  idmcShortName
                  monitoringExpert {
                    id
                    user {
                      id
                      fullName
                    }
                  }
                }
              }
            }
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type RegionalCordinatorFormFields = UpdateRegionalCoordinatorMutationVariables['data'];
type FormType = PurgeNull<PartialForm<WithId<RegionalCordinatorFormFields>>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        monitoringSubRegion: [requiredStringCondition],
        user: [requiredStringCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface CreateRegionalCordinatorFormProps {
    onCordinatorFormCancel: () => void;
}

function CordinatorForm(props: CreateRegionalCordinatorFormProps) {
    const {
        onCordinatorFormCancel,
    } = props;

    const manageCordinatorVariables = useMemo(
        (): ManageCordinatorQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        data: manageData,
        loading: loadingCordinators,
    } = useQuery<ManageCordinatorQuery, ManageCordinatorQueryVariables>(MANAGE_CORDINATOR, {
        variables: manageCordinatorVariables,
    });
    console.log('Check manageCordinator::>>', manageData);

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
        users,
        setUsers,
    ] = useState<UserOption[] | undefined | null>();

    const [
        regionByIds,
        setRegions,
    ] = useState<RegionOption[] | null | undefined>();

    const [
        updateRegionalCoordinator,
        { loading: updateCordinatorLoading },
    ] = useMutation<UpdateRegionalCoordinatorMutation, UpdateRegionalCoordinatorMutationVariables>(
        UPDATE_REGIONAL_CORDINATOR,
        {
            onCompleted: (response) => {
                const { updateRegionalCoordinatorPortfolio: updateOrganizationRes } = response;
                if (!updateOrganizationRes) {
                    return;
                }
                const { errors, ok } = updateOrganizationRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (ok) {
                    notify({ children: 'Regional Cordinator updated successfully!' });
                    onPristineSet(true);
                    onCordinatorFormCancel();
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

    const loading = updateCordinatorLoading;
    const disabled = loading;

    const handleSubmit = React.useCallback(
        (finalValues: FormType) => {
            if (finalValues.id) {
                updateRegionalCoordinator({
                    variables: {
                        id: finalValues.id,
                        data: finalValues as WithId<RegionalCordinatorFormFields>,
                    },
                });
            }
        }, [updateRegionalCoordinator],
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
                <RegionMultiSelectInput
                    className={styles.input}
                    options={regionByIds}
                    onOptionsChange={setRegions}
                    label="Region Name*"
                    name="monitoringSubRegion"
                    value={value.monitoringSubRegion}
                    onChange={onValueChange}
                />
            </Row>
            <Row>
                <ReviewersMultiSelectInput
                    name="user"
                    label="Regional Cordinator Person"
                    onChange={onValueChange}
                    value={value.user}
                    disabled={disabled}
                    options={users}
                    onOptionsChange={setUsers}
                    error={error?.$internal}
                />
            </Row>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onCordinatorFormCancel}
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

export default CordinatorForm;
