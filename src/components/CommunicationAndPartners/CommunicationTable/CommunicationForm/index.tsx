import React from 'react';
import {
    TextInput,
    SelectInput,
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';

import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import Loading from '#components/Loading';
import useForm, { createSubmitHandler } from '#utils/form';
import { removeNull } from '#utils/schema';
import type { Schema } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    requiredCondition,
    idCondition,
} from '#utils/validation';

import {
    CommunicationMediumListQuery,
    CreateCommunicationMutation,
    CreateCommunicationMutationVariables,
    UpdateCommunicationMutation,
    UpdateCommunicationMutationVariables,
    CommunicationQuery,
    ContactType,
    CommunicationMediumType,
} from '#generated/types';

import styles from './styles.css';

const getKeySelectorValue = (data: CommunicationMediumType) => data.id;

const getLabelSelectorValue = (data: CommunicationMediumType) => data.name;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type CommunicationFormFields = CreateCommunicationMutationVariables['communication'];
type FormType = PurgeNull<PartialForm<WithId<CommunicationFormFields>>>;

const schema: Schema<FormType> = {
    fields: () => ({
        id: [idCondition],
        title: [],
        subject: [requiredCondition],
        content: [requiredCondition],
        dateTime: [],
        medium: [requiredCondition],
        contact: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

const CREATE_COMMUNICATION = gql`
    mutation CreateCommunication($communication: CommunicationCreateInputType!) {
        createCommunication(data: $communication) {
            result {
                id
                content
                dateTime
                medium {
                    id
                    name
                }
                subject
                title
                contact {
                    id
                }
            }
            errors {
                field
                messages
            }
        }
    }
`;

const UPDATE_COMMUNICATION = gql`
    mutation UpdateCommunication($communication: CommunicationUpdateInputType!) {
        updateCommunication(data: $communication) {
            result {
                id
                content
                dateTime
                medium {
                    id
                    name
                }
                subject
                title
                contact {
                    id
                }
            }
            errors {
                field
                messages
            }
        }
    }
`;

const COMMUNICATION = gql`
    query Communication($id: ID!) {
        communication(id: $id) {
            id
            content
            dateTime
            medium {
                id
                name
            }
            subject
            title
            contact {
                id
            }
        }
    }
`;

const GET_MEDIUMS_LIST = gql`
    query CommunicationMediumList {
        communicationMediumList {
            results {
                id
                name
            }
        }
    }
`;

interface CommunicationFormProps {
    contact: ContactType['id'];
    id: string | undefined;
    onHideAddCommunicationModal: () => void;
    onAddCommunicationCache: MutationUpdaterFn<CreateCommunicationMutation>;
    onUpdateCommunicationCache: MutationUpdaterFn<UpdateCommunicationMutation>;
}

function CommunicationForm(props:CommunicationFormProps) {
    const {
        contact,
        onUpdateCommunicationCache,
        onHideAddCommunicationModal,
        onAddCommunicationCache,
        id,
    } = props;

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        loading: communicationDataLoading,
        error: communicationDataError,
    } = useQuery<CommunicationQuery>(
        COMMUNICATION,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { communication } = response;
                if (!communication) {
                    return;
                }
                onValueSet(removeNull({
                    ...communication,
                    medium: communication.medium?.id,
                    contact: communication.contact.id,
                }));
            },
        },
    );

    const {
        data: mediums,
        error: mediumsError,
        loading: mediumsLoading,
    } = useQuery<CommunicationMediumListQuery>(GET_MEDIUMS_LIST);

    const [
        createCommunication,
        { loading: createLoading },
    ] = useMutation<CreateCommunicationMutation, CreateCommunicationMutationVariables>(
        CREATE_COMMUNICATION,
        {
            update: onAddCommunicationCache,
            onCompleted: (response) => {
                const { createCommunication: createCommunicationRes } = response;
                if (!createCommunicationRes) {
                    return;
                }
                const { errors, result } = createCommunicationRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    onHideAddCommunicationModal();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateCommunication,
        { loading: updateLoading },
    ] = useMutation<UpdateCommunicationMutation, UpdateCommunicationMutationVariables>(
        UPDATE_COMMUNICATION,
        {
            update: onUpdateCommunicationCache,
            onCompleted: (response) => {
                const { updateCommunication: updateCommunicationRes } = response;
                if (!updateCommunicationRes) {
                    return;
                }
                const { errors, result } = updateCommunicationRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    onHideAddCommunicationModal();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            if (finalValues.id) {
                updateCommunication({
                    variables: {
                        communication: finalValues as WithId<CommunicationFormFields>,
                    },
                });
            } else {
                createCommunication({
                    variables: {
                        communication: {
                            ...finalValues as CommunicationFormFields,
                            contact,
                        },
                    },
                });
            }
        },
        [createCommunication, updateCommunication, contact],
    );

    const mediumsList = mediums?.communicationMediumList?.results;
    const loading = createLoading || updateLoading || communicationDataLoading || mediumsLoading;
    const errored = !!communicationDataError || !!mediumsError;
    const disabled = loading || errored;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {error?.$internal && (
                <p>
                    {error?.$internal}
                </p>
            )}
            <div className={styles.row}>
                <TextInput
                    label="Title"
                    value={value.title}
                    onChange={onValueChange}
                    name="title"
                    error={error?.fields?.title}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Date Time"
                    value={value.dateTime}
                    onChange={onValueChange}
                    name="dateTime"
                    error={error?.fields?.dateTime}
                    disabled={disabled}
                />
                <SelectInput
                    label="Medium *"
                    name="medium"
                    options={mediumsList}
                    value={value.medium}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    onChange={onValueChange}
                    error={error?.fields?.medium}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Subject *"
                    value={value.subject}
                    onChange={onValueChange}
                    name="subject"
                    error={error?.fields?.subject}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Content *"
                    value={value.content}
                    onChange={onValueChange}
                    name="content"
                    error={error?.fields?.content}
                    disabled={disabled}
                />
            </div>
            {loading && <Loading />}
            <div className={styles.formButtons}>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled}
                    className={styles.button}
                    variant="primary"
                >
                    Submit
                </Button>
                <Button
                    name={undefined}
                    onClick={onHideAddCommunicationModal}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default CommunicationForm;
