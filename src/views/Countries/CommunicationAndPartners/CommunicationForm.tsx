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
    ApolloCache,
    FetchResult,
} from '@apollo/client';

import Loading from '#components/Loading';
import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { transformToFormError, ObjectError } from '#utils/errorTransform';

import {
    PartialForm,
    BasicEntity,
    CommunicationEntity,
    CommunicationFormFields,
} from '#types';

import {
    requiredCondition,
} from '#utils/validation';

import styles from './styles.css';

const getKeySelectorValue = (data: BasicEntity) => data.id;

const getLabelSelectorValue = (data: BasicEntity) => data.name;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };

const schema: Schema<PartialForm<WithId<CommunicationFormFields>>> = {
    fields: () => ({
        id: [],
        title: [],
        subject: [requiredCondition],
        content: [requiredCondition],
        dateTime: [],
        medium: [requiredCondition],
        contact: [],
    }),
};

const defaultFormValues: PartialForm<WithId<CommunicationFormFields>> = {};

interface CreateCommunicationVariables {
    communication: CommunicationFormFields;
}

interface MediumsResponseFields {
    communicationMediumList: {
        results: BasicEntity[],
    }
}

interface UpdateCommunicationVariables {
    communication: WithId<CommunicationFormFields>;
}

interface CreateCommunicationResponseFields {
    createCommunication: {
        errors?: ObjectError[];
        communication: CommunicationEntity;
    }
}

interface UpdateCommunicationResponseFields {
    updateCommunication: {
        errors?: ObjectError[];
        communication: CommunicationEntity;
    }
}

const CREATE_COMMUNICATION = gql`
    mutation CreateCommunication($communication: CommunicationCreateInputType!) {
        createCommunication(communication: $communication) {
            communication {
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
    updateCommunication(communication: $communication) {
            communication {
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
    contact: BasicEntity['id'];
    id: string | undefined;
    onHideAddCommunicationModal: () => void;
    onAddCommunicationCache: (
        cache: ApolloCache<CreateCommunicationResponseFields>,
        data: FetchResult<CreateCommunicationResponseFields>
    ) => void;
    onUpdateCommunicationCache: (
        cache: ApolloCache<UpdateCommunicationResponseFields>,
        data: FetchResult<UpdateCommunicationResponseFields>
    ) => void;
}

interface CommunicationResponse {
    communication: CommunicationEntity;
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
    } = useQuery<CommunicationResponse>(
        COMMUNICATION,
        {
            skip: !id,
            variables: { id },
            onCompleted: (response) => {
                const { communication } = response;
                onValueSet({
                    ...communication,
                    contact: communication.contact.id,
                });
            },
        },
    );

    const {
        data: mediums,
        error: mediumsError,
        loading: mediumsLoading,
    } = useQuery<MediumsResponseFields>(GET_MEDIUMS_LIST);

    const mediumsList = mediums?.communicationMediumList.results;

    const [
        createCommunication,
        { loading: createLoading },
    ] = useMutation<CreateCommunicationResponseFields, CreateCommunicationVariables>(
        CREATE_COMMUNICATION,
        {
            update: onAddCommunicationCache,
            onCompleted: (response) => {
                if (response.createCommunication.errors) {
                    const formError = transformToFormError(response.createCommunication.errors);
                    onErrorSet(formError);
                } else {
                    onHideAddCommunicationModal();
                }
            },
        },
    );

    const [
        updateCommunication,
        { loading: updateLoading },
    ] = useMutation<UpdateCommunicationResponseFields, UpdateCommunicationVariables>(
        UPDATE_COMMUNICATION,
        {
            update: onUpdateCommunicationCache,
            onCompleted: (response) => {
                if (response.updateCommunication.errors) {
                    const formError = transformToFormError(response.updateCommunication.errors);
                    onErrorSet(formError);
                } else {
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

    const loading = createLoading || updateLoading || communicationDataLoading || mediumsLoading;
    const errored = !!communicationDataError || !!mediumsError;

    const disabled = loading || errored;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<WithId<CommunicationFormFields>>) => {
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
        }, [createCommunication, updateCommunication, contact],
    );

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
