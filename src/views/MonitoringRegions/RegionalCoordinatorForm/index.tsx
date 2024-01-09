import React, { useState, useContext, useMemo, useCallback } from 'react';
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

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import UserSelectInput from '#components/selections/UserSelectInput';

import useOptions from '#hooks/useOptions';
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
                        isActive
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
                    isActive
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

    const [, setAssignedToOptions] = useOptions('user');

    // NOTE: We do not use useOptions as this is filtered options
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
                    notify({
                        children: 'Regional Coordinator updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onCoordinatorFormCancel();
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

    const loading = updateCoordinatorLoading;
    const disabled = loading || loadingRegions;

    const handleSubmit = useCallback(
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
            <UserSelectInput
                label="Regional Coordinator *"
                name="user"
                onChange={onValueChange}
                value={value.user}
                disabled={disabled}
                error={error?.fields?.user}
                autoFocus
            />
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onCoordinatorFormCancel}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                >
                    Save
                </Button>
            </div>
        </form>
    );
}

export default RegionalCoordinatorForm;
