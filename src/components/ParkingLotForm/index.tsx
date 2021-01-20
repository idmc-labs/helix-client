import React, { useState, useContext } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TextInput,
    SelectInput,
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';

import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import CountrySelectInput, { CountryOption } from '#components/CountrySelectInput';
import NotificationContext from '#components/NotificationContext';
import UserSelectInput, { UserOption } from '#components/UserSelectInput';
import Loading from '#components/Loading';

import { removeNull } from '#utils/schema';
import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import { transformToFormError } from '#utils/errorTransform';

import {
    requiredCondition,
    requiredStringCondition,
    idCondition,
    urlCondition,
} from '#utils/validation';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    ParkingLotOptionsQuery,
    ParkingLotQuery,
    ParkingLotQueryVariables,
    CreateParkingLotMutation,
    CreateParkingLotMutationVariables,
    UpdateParkingLotMutation,
    UpdateParkingLotMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const PARKING_LOT_OPTIONS = gql`
    query ParkingLotOptions {
        status: __type(name: "PARKING_LOT_STATUS") {
            enumValues {
                name
                description
            }
        }
    }
`;

const PARKING_LOT = gql`
    query ParkingLot($id: ID!) {
        parkingLot(id: $id) {
            comments
            country {
                id
                name
            }
            id
            assignedTo {
                id
                fullName
            }
            status
            createdBy {
                id
                fullName
            }
            title
            url
        }
    }
`;

const CREATE_PARKING_LOT = gql`
    mutation CreateParkingLot($parkingLot: ParkingLotCreateInputType!) {
        createParkingLot(data: $parkingLot) {
            result {
                id
            }
            errors
        }
    }
`;

const UPDATE_PARKING_LOT = gql`
    mutation UpdateParkingLot($parkingLot: ParkingLotUpdateInputType!) {
        updateParkingLot(data: $parkingLot) {
            result {
                id
            }
            errors
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ParkingLotFormFields = CreateParkingLotMutationVariables['parkingLot'];
type FormType = PurgeNull<PartialForm<WithId<Omit<ParkingLotFormFields, 'status'> & { status: string }>>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        country: [requiredCondition],
        title: [requiredStringCondition],
        url: [requiredCondition, urlCondition],
        assignedTo: [requiredCondition],
        status: [requiredCondition],
        comments: [],
    }),
};

interface ParkingLotFormProps {
    className?: string;
    onParkingLotCreate?: (result: NonNullable<NonNullable<CreateParkingLotMutation['createParkingLot']>['result']>) => void;
    id?: string;
    readOnly?: boolean;
    onParkingLotFormCancel: () => void;
}

function ParkingLotForm(props: ParkingLotFormProps) {
    const {
        onParkingLotCreate,
        id,
        readOnly,
        className,
        onParkingLotFormCancel,
    } = props;

    const [
        countryOptions,
        setCountryOptions,
    ] = useState<CountryOption[] | null | undefined>();

    const [
        assignedToOptions,
        setAssignedToOptions,
    ] = useState<UserOption[] | null | undefined>();

    const defaultFormValues: PartialForm<FormType> = {
        status: 'TO_BE_REVIEWED',
    };

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const { notify } = useContext(NotificationContext);

    const {
        loading: parkingLotDataLoading,
        error: parkingLotDataError,
    } = useQuery<ParkingLotQuery, ParkingLotQueryVariables>(
        PARKING_LOT,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { parkingLot } = response;
                if (!parkingLot) {
                    return;
                }

                if (parkingLot.country) {
                    setCountryOptions([parkingLot.country]);
                }

                if (parkingLot.assignedTo) {
                    setAssignedToOptions([parkingLot.assignedTo]);
                }

                onValueSet(removeNull({
                    ...parkingLot,
                    country: parkingLot.country.id,
                    assignedTo: parkingLot.assignedTo?.id,
                }));
            },
        },
    );

    const {
        data: parkingLotOptions,
        loading: parkingLotOptionsLoading,
        error: parkingLotOptionsError,
    } = useQuery<ParkingLotOptionsQuery>(PARKING_LOT_OPTIONS);

    const statusOptions = parkingLotOptions?.status?.enumValues;

    const [
        createParkingLot,
        { loading: createLoading },
    ] = useMutation<CreateParkingLotMutation, CreateParkingLotMutationVariables>(
        CREATE_PARKING_LOT,
        {
            onCompleted: (response) => {
                const {
                    createParkingLot: createParkingLotRes,
                } = response;
                if (!createParkingLotRes) {
                    return;
                }
                const { errors, result } = createParkingLotRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to create parkingLot.' });
                    onErrorSet(formError);
                }
                if (onParkingLotCreate && result) {
                    notify({ children: 'ParkingLot created successfully!' });
                    onPristineSet(true);
                    onParkingLotCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to create parkingLot.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateParkingLot,
        { loading: updateLoading },
    ] = useMutation<UpdateParkingLotMutation, UpdateParkingLotMutationVariables>(
        UPDATE_PARKING_LOT,
        {
            onCompleted: (response) => {
                const {
                    updateParkingLot: updateParkingLotRes,
                } = response;
                if (!updateParkingLotRes) {
                    return;
                }
                const { errors, result } = updateParkingLotRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to update parkingLot.' });
                    onErrorSet(formError);
                }
                if (onParkingLotCreate && result) {
                    notify({ children: 'ParkingLot updated successfully!' });
                    onPristineSet(true);
                    onParkingLotCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update parkingLot.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateParkingLot({
                variables: {
                    parkingLot: finalValues as WithId<ParkingLotFormFields>,
                },
            });
        } else {
            createParkingLot({
                variables: {
                    parkingLot: finalValues as ParkingLotFormFields,
                },
            });
        }
    }, [createParkingLot, updateParkingLot]);

    // eslint-disable-next-line max-len
    const loading = createLoading || updateLoading || parkingLotDataLoading || parkingLotOptionsLoading;
    const errored = !!parkingLotDataError || !!parkingLotOptionsError;
    const disabled = loading || errored;

    return (
        <form
            className={_cs(className, styles.parkingLotForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.row}>
                <TextInput
                    label="Title *"
                    name="title"
                    value={value.title}
                    onChange={onValueChange}
                    error={error?.fields?.title}
                    disabled={disabled}
                    readOnly={readOnly}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    className={styles.input}
                    label="URL *"
                    name="url"
                    value={value.url}
                    onChange={onValueChange}
                    error={error?.fields?.url}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <CountrySelectInput
                    label="Country *"
                    options={countryOptions}
                    name="country"
                    onOptionsChange={setCountryOptions}
                    onChange={onValueChange}
                    value={value.country}
                    error={error?.fields?.country}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <UserSelectInput
                    label="Assign To *"
                    options={assignedToOptions}
                    name="assignedTo"
                    onOptionsChange={setAssignedToOptions}
                    onChange={onValueChange}
                    value={value.assignedTo}
                    error={error?.fields?.assignedTo}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <SelectInput
                    label="Status *"
                    name="status"
                    options={statusOptions}
                    value={value.status}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.status}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Comments"
                    name="comments"
                    value={value.comments}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.comments}
                    readOnly={readOnly}
                />
            </div>
            {!readOnly && (
                <div className={styles.formButtons}>
                    {!!onParkingLotFormCancel && (
                        <Button
                            name={undefined}
                            onClick={onParkingLotFormCancel}
                            className={styles.button}
                            disabled={disabled}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        name={undefined}
                        disabled={disabled || pristine}
                        variant="primary"
                        className={styles.button}
                    >
                        Submit
                    </Button>
                </div>
            )}
        </form>
    );
}

export default ParkingLotForm;
