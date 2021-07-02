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
    requiredCondition,
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
    WithId,
} from '#utils/common';

import {
    ManageCoordinatorQuery,
    ManageCoordinatorQueryVariables,
    UpdateRegionalCoordinatorMutation,
    UpdateRegionalCoordinatorMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const UPDATE_REGIONAL_COORDINATOR = gql`
    mutation updateRegionalCoordinator($data: RegionalCoordinatorPortfolioInputType!) {
        updateRegionalCoordinatorPortfolio(data: $data) {
            errors
            ok
            result {
                id
                regionalCoordinator {
                  user {
                    fullName
                    id
                  }
                }
            }
        }
    }
`;

const COORDINATOR_INFO = gql`
    query manageCoordinator($id: ID!) {
        monitoringSubRegion(id: $id) {
            id
            name
            regionalCoordinator {
              user {
                id
                fullName
              }
            }
        }
    }
`;

type RegionalCoordinatorFormFields = UpdateRegionalCoordinatorMutationVariables['data'];
type FormType = PurgeNull<PartialForm<WithId<RegionalCoordinatorFormFields>>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        monitoringSubRegion: [requiredCondition],
        user: [requiredCondition],
    }),
};

interface RegionOption {
    id: string;
    name: string;
}

const defaultFormValues: PartialForm<FormType> = {};

interface Props {
    id?: string;
    onCoordinatorFormCancel: () => void;
}

function RegionalCoordinatorForm(props: Props) {
    const {
        id,
        onCoordinatorFormCancel,
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
        assignedToOptions,
        setAssignedToOptions,
    ] = useState<UserOption[] | null | undefined>();

    const [
        regionList,
        setRegionList,
    ] = useState<RegionOption[] | null | undefined>();

    const manageCoordinatorVariables = useMemo(
        (): ManageCoordinatorQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: loadingRegions,
    } = useQuery<ManageCoordinatorQuery, ManageCoordinatorQueryVariables>(COORDINATOR_INFO, {
        skip: !manageCoordinatorVariables,
        variables: manageCoordinatorVariables,
        onCompleted: (response) => {
            const { monitoringSubRegion } = response;
            if (monitoringSubRegion) {
                setRegionList([{ id: monitoringSubRegion.id, name: monitoringSubRegion.name }]);
                onValueSet({
                    monitoringSubRegion: monitoringSubRegion.id,
                    user: monitoringSubRegion.regionalCoordinator?.user.id,
                });
                if (monitoringSubRegion.regionalCoordinator?.user) {
                    setAssignedToOptions([monitoringSubRegion.regionalCoordinator.user]);
                }
            }
        },
    });

    const [
        updateRegionalCoordinator,
        { loading: updateCoordinatorLoading },
    ] = useMutation<UpdateRegionalCoordinatorMutation, UpdateRegionalCoordinatorMutationVariables>(
        UPDATE_REGIONAL_COORDINATOR,
        {
            // TODO: Query update requried to fetch latest regionalCoordinator
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
                    notify({ children: 'Regional Coordinator updated successfully!' });
                    onPristineSet(true);
                    onCoordinatorFormCancel();
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

    const loading = updateCoordinatorLoading;
    const disabled = loading || loadingRegions;

    const handleSubmit = React.useCallback(
        (finalValues: FormType) => {
            updateRegionalCoordinator({
                variables: {
                    data: finalValues as WithId<RegionalCoordinatorFormFields>,
                },
            });
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
                <SelectInput
                    options={regionList}
                    label="Region *"
                    name="monitoringSubRegion"
                    value={value.monitoringSubRegion}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    disabled={disabled}
                    readOnly
                />
            </Row>
            <Row>
                <UserSelectInput
                    label="Regional Coordinator *"
                    name="user"
                    onChange={onValueChange}
                    value={value.user}
                    disabled={disabled}
                    options={assignedToOptions}
                    onOptionsChange={setAssignedToOptions}
                    error={error?.fields?.user}
                />
            </Row>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onCoordinatorFormCancel}
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

export default RegionalCoordinatorForm;
