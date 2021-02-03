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
    ParkedItemOptionsQuery,
    ParkedItemQuery,
    ParkedItemQueryVariables,
    CreateParkedItemMutation,
    CreateParkedItemMutationVariables,
    UpdateParkedItemMutation,
    UpdateParkedItemMutationVariables,
} from '#generated/types';
import styles from './styles.css';

const PARKING_LOT_OPTIONS = gql`
    query ParkedItemOptions {
        status: __type(name: "PARKING_LOT_STATUS") {
            enumValues {
                name
                description
            }
        }
    }
`;

const PARKING_LOT = gql`
    query ParkedItem($id: ID!) {
        parkedItem(id: $id) {
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
    mutation CreateParkedItem($parkedItem: ParkedItemCreateInputType!) {
        createParkedItem(data: $parkedItem) {
            result {
                id
            }
            errors
        }
    }
`;

const UPDATE_PARKING_LOT = gql`
    mutation UpdateParkedItem($parkedItem: ParkedItemUpdateInputType!) {
        updateParkedItem(data: $parkedItem) {
            result {
                id
            }
            errors
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ParkedItemFormFields = CreateParkedItemMutationVariables['parkedItem'];
type FormType = PurgeNull<PartialForm<WithId<Omit<ParkedItemFormFields, 'status'> & { status: string }>>>;

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

interface ParkedItemFormProps {
    className?: string;
    onParkedItemCreate?: (result: NonNullable<NonNullable<CreateParkedItemMutation['createParkedItem']>['result']>) => void;
    id?: string;
    readOnly?: boolean;
    onParkedItemFormCancel: () => void;
}

function ParkedItemForm(props: ParkedItemFormProps) {
    const {
        onParkedItemCreate,
        id,
        readOnly,
        className,
        onParkedItemFormCancel,
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
        loading: parkedItemDataLoading,
        error: parkedItemDataError,
    } = useQuery<ParkedItemQuery, ParkedItemQueryVariables>(
        PARKING_LOT,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { parkedItem } = response;
                if (!parkedItem) {
                    return;
                }

                if (parkedItem.country) {
                    setCountryOptions([parkedItem.country]);
                }

                if (parkedItem.assignedTo) {
                    setAssignedToOptions([parkedItem.assignedTo]);
                }

                onValueSet(removeNull({
                    ...parkedItem,
                    country: parkedItem.country.id,
                    assignedTo: parkedItem.assignedTo?.id,
                }));
            },
        },
    );

    const {
        data: parkedItemOptions,
        loading: parkedItemOptionsLoading,
        error: parkedItemOptionsError,
    } = useQuery<ParkedItemOptionsQuery>(PARKING_LOT_OPTIONS);

    const statusOptions = parkedItemOptions?.status?.enumValues;

    const [
        createParkedItem,
        { loading: createLoading },
    ] = useMutation<CreateParkedItemMutation, CreateParkedItemMutationVariables>(
        CREATE_PARKING_LOT,
        {
            onCompleted: (response) => {
                const {
                    createParkedItem: createParkedItemRes,
                } = response;
                if (!createParkedItemRes) {
                    return;
                }
                const { errors, result } = createParkedItemRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to create parked item.' });
                    onErrorSet(formError);
                }
                if (onParkedItemCreate && result) {
                    notify({ children: 'Parked item created successfully!' });
                    onPristineSet(true);
                    onParkedItemCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to create parked item.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateParkedItem,
        { loading: updateLoading },
    ] = useMutation<UpdateParkedItemMutation, UpdateParkedItemMutationVariables>(
        UPDATE_PARKING_LOT,
        {
            onCompleted: (response) => {
                const {
                    updateParkedItem: updateParkedItemRes,
                } = response;
                if (!updateParkedItemRes) {
                    return;
                }
                const { errors, result } = updateParkedItemRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notify({ children: 'Failed to update parked item.' });
                    onErrorSet(formError);
                }
                if (onParkedItemCreate && result) {
                    notify({ children: 'Parked item updated successfully!' });
                    onPristineSet(true);
                    onParkedItemCreate(result);
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update parked item.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        if (finalValues.id) {
            updateParkedItem({
                variables: {
                    parkedItem: finalValues as WithId<ParkedItemFormFields>,
                },
            });
        } else {
            createParkedItem({
                variables: {
                    parkedItem: finalValues as ParkedItemFormFields,
                },
            });
        }
    }, [createParkedItem, updateParkedItem]);

    // eslint-disable-next-line max-len
    const loading = createLoading || updateLoading || parkedItemDataLoading || parkedItemOptionsLoading;
    const errored = !!parkedItemDataError || !!parkedItemOptionsError;
    const disabled = loading || errored;

    return (
        <form
            className={_cs(className, styles.parkedItemForm)}
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
                    label="Assignee *"
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
                    {!!onParkedItemFormCancel && (
                        <Button
                            name={undefined}
                            onClick={onParkedItemFormCancel}
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

export default ParkedItemForm;
