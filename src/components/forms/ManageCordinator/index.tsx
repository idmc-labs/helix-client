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
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import {
    ManageCordinatorQuery,
    ManageCordinatorQueryVariables,
    UpdateRegionalCoordinatorMutation,
    UpdateRegionalCoordinatorMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const UPDATE_REGIONAL_CORDINATOR = gql`
    mutation updateRegionalCoordinator($data: RegionalCoordinatorPortfolioInputType!) {
        updateRegionalCoordinatorPortfolio(data: $data) {
            errors
            ok
        }
    }
`;

const CORDINATOR_INFO = gql`
    query manageCordinator($id: ID!) {
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

interface UpdateRegionalCordinatorFormProps {
    id?: string;
    onCordinatorFormCancel: () => void;
}

interface RegionOption {
    id: string;
    name: string;
}

function ManageCordinator(props: UpdateRegionalCordinatorFormProps) {
    const {
        id,
        onCordinatorFormCancel,
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

    const [
        regionList,
        setRegionList,
    ] = useState<RegionOption[] | null | undefined>();

    const manageCordinatorVariables = useMemo(
        (): ManageCordinatorQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: loadingRegions,
    } = useQuery<ManageCordinatorQuery, ManageCordinatorQueryVariables>(CORDINATOR_INFO, {
        skip: !manageCordinatorVariables,
        variables: manageCordinatorVariables,
        onCompleted: (response) => {
            const { monitoringSubRegion } = response;
            if (monitoringSubRegion) {
                setRegionList([{ id: monitoringSubRegion.id, name: monitoringSubRegion.name }]);
            }
        },
    });

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
    const disabled = loading || loadingRegions;

    const handleSubmit = React.useCallback(
        (finalValues: FormType) => {
            if (finalValues.id) {
                updateRegionalCoordinator({
                    variables: {
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
                <SelectInput
                    className={styles.input}
                    options={regionList}
                    label="Region Name*"
                    name="monitoringSubRegion"
                    value={value.monitoringSubRegion}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <UserSelectInput
                    name="user"
                    label="Regional Cordinator Person"
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

export default ManageCordinator;
