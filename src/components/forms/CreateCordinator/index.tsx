import React, { useState, useContext } from 'react';

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
    idCondition,
    requiredStringCondition,
} from '@togglecorp/toggle-form';
import {
    gql,
    useMutation,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import ReviewersMultiSelectInput, { UserOption } from '#components/selections/ReviewersMultiSelectInput';

import { transformToFormError } from '#utils/errorTransform';

import {
    CreateRegionalCoordinatorMutation,
    CreateRegionalCoordinatorMutationVariables,
    UpdateRegionalCoordinatorMutation,
    UpdateRegionalCoordinatorMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const CREATE_REGIONAL_CORDINATOR = gql`
    mutation CreateRegionalCoordinator($regionalCordinator: RegionalCoordinatorPortfolioInputType!) {
        createRegionalCoordinatorPortfolio(data: $regionalCordinator) {
            errors
            ok
        }
    }
`;

const UPDATE_REGIONAL_CORDINATOR = gql`
    mutation updateRegionalCoordinator($regionalCordinator: RegionalCoordinatorPortfolioInputType!, $id: ID!) {
        updateRegionalCoordinatorPortfolio(data: $regionalCordinator, id: $id) {
            errors
            ok
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type RegionalCordinatorFormFields = CreateRegionalCoordinatorMutationVariables['regionalCordinator'];
type FormType = PurgeNull<PartialForm<WithId<RegionalCordinatorFormFields>>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        monitoringSubRegion: [requiredStringCondition],
        user: [],
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
        createRegionalCoordinator,
        { loading: createCordinatorLoading },
    ] = useMutation<CreateRegionalCoordinatorMutation, CreateRegionalCoordinatorMutationVariables>(
        CREATE_REGIONAL_CORDINATOR,
        {
            onCompleted: (response) => {
                const { createRegionalCoordinatorPortfolio: createCordinatorRes } = response;
                if (!createCordinatorRes) {
                    return;
                }
                const { errors, ok } = createCordinatorRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (ok) {
                    notify({ children: 'Regional Cordinator created successfully!' });
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

    const loading = createCordinatorLoading || updateCordinatorLoading;
    const disabled = loading;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            if (finalValues.id) {
                updateRegionalCoordinator({
                    variables: {
                        id: finalValues.id as WithId<RegionalCordinatorFormFields>,
                        data: finalValues as WithId<RegionalCordinatorFormFields>,
                    },
                });
            } else {
                createRegionalCoordinator({
                    variables: {
                        data: finalValues as RegionalCordinatorFormFields,
                    },
                });
            }
        }, [createRegionalCoordinator, updateRegionalCoordinator],
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
                <TextInput
                    label="Region Name *"
                    value={value.monitoringSubRegion}
                    onChange={onValueChange}
                    name="monitoringSubRegion"
                    error={error?.fields?.monitoringSubRegion}
                    disabled={disabled}
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
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default CordinatorForm;
