import React, { useCallback } from 'react';
import {
    IoMdTrash,
    IoMdCreate,
} from 'react-icons/io';

import { gql, useMutation, MutationUpdaterFn } from '@apollo/client';

import QuickActionButton from '#components/QuickActionButton';
import QuickActionConfirmButton from '#components/QuickActionConfirmButton';
import DateCell from '#components/tableHelpers/Date';

import styles from './styles.css';
import {
    ResourcesQuery,
    DeleteResourceMutation,
    DeleteResourceMutationVariables,
} from '#generated/types';

const DELETE_RESOURCE = gql`
    mutation DeleteResource($id: ID!) {
        deleteResource(id: $id) {
            errors {
                field
                messages
            }
            ok
            result {
                id
            }
        }
    }
`;

const GET_RESOURCES_LIST = gql`
    query Resources {
        resourceList {
            results {
                id
                name
                url
                lastAccessedOn
                createdAt
                modifiedAt
                group {
                    id
                    name
                }
                countries {
                    id
                }
            }
        }
      }
`;

const handleRemoveResourceFromCache: MutationUpdaterFn<DeleteResourceMutation> = (cache, data) => {
    if (!data) {
        return;
    }

    const resId = data.data?.deleteResource?.result?.id;
    if (!resId) {
        return;
    }

    const cacheResources = cache.readQuery<ResourcesQuery>({
        query: GET_RESOURCES_LIST,
    });
    if (!cacheResources) {
        return;
    }

    const results = cacheResources?.resourceList?.results;
    if (!results) {
        return;
    }
    const newResults = results.filter((res) => res.id !== resId);

    cache.writeQuery({
        query: GET_RESOURCES_LIST,
        data: {
            resourceList: {
                __typename: 'ResourceListType',
                results: newResults,
            },
        },
    });
};

interface ResourceItemProps {
    title: string,
    lastAccessedOn: string,
    onSetResourceIdOnEdit: (id: string) => void,
    url: string,
    keyValue: string,
}

function ResourceItem(props: ResourceItemProps) {
    const {
        title,
        lastAccessedOn,
        keyValue,
        onSetResourceIdOnEdit,
        url,
    } = props;

    const onSetEditableResourceItemId = useCallback(() => {
        onSetResourceIdOnEdit(keyValue);
    }, [keyValue, onSetResourceIdOnEdit]);

    const [deleteResource, {
        loading: deleteResourceLoading,
    }] = useMutation<DeleteResourceMutation, DeleteResourceMutationVariables>(
        DELETE_RESOURCE,
        {
            update: handleRemoveResourceFromCache,
            onCompleted: (response) => {
                const { deleteResource: deleteResourceRes } = response;
                if (!deleteResourceRes) {
                    return;
                }
                const { errors } = deleteResourceRes;
                if (errors) {
                    // TODO: handle what to do if errors?
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const onDeleteResource = useCallback((id) => {
        if (!id) {
            return;
        }
        deleteResource({
            variables: { id },
        });
    }, [deleteResource]);

    return (
        <div
            className={styles.resourceItemContainer}
        >
            <div className={styles.itemRow}>
                <a
                    href={url}
                    className={styles.title}
                    rel="noreferrer"
                    target="_blank"
                >
                    {title}
                </a>
                <div className={styles.actionButtons}>
                    <QuickActionButton
                        name={undefined}
                        onClick={onSetEditableResourceItemId}
                        disabled={deleteResourceLoading}
                        title="Edit"
                    >
                        <IoMdCreate />
                    </QuickActionButton>
                    <QuickActionConfirmButton
                        name={undefined}
                        onConfirm={() => onDeleteResource(keyValue)}
                        confirmationHeader="Confirm Delete"
                        confirmationMessage="Are you sure you want to delete?"
                        className={styles.deleteButton}
                        disabled={deleteResourceLoading}
                        title="Delete"
                    >
                        <IoMdTrash />
                    </QuickActionConfirmButton>
                </div>
            </div>
            <DateCell
                value={lastAccessedOn}
                className={styles.lastAccessedOn}
            />
        </div>
    );
}

export default ResourceItem;
