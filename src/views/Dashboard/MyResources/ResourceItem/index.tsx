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
import { Resource } from '../myResources.interface';

interface DeleteResourceVariables {
    id: string | undefined,
}

interface DeleteResourceResponse {
    deleteResource: {
        ok: boolean,
        errors?: {
            field: string,
            message: string,
        }[],
        resource: {
            id: string,
        },
    }
}

interface DeleteResourceCache {
    deleteResource: {
        resource: {
            id: Resource['id'];
        };
    }
}

interface GetResoucesListResponse {
    resourceList: {
        results: Resource[],
    };
}

const DELETE_RESOURCE = gql`
    mutation DeleteResource($id: ID!) {
        deleteResource(id: $id) {
            errors {
                field
                messages
            }
            ok
            resource {
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
            createdAt
            lastAccessedOn
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

const handleRemoveResourceFromCache: MutationUpdaterFn<DeleteResourceCache> = (cache, data) => {
    const resId = data.data?.deleteResource.resource.id;

    if (!resId) {
        return;
    }

    const cacheResources = cache.readQuery<GetResoucesListResponse>({
        query: GET_RESOURCES_LIST,
    });
    const results = cacheResources?.resourceList.results ?? [];

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
    }] = useMutation<DeleteResourceResponse, DeleteResourceVariables>(
        DELETE_RESOURCE,
        {
            update: handleRemoveResourceFromCache,
            onCompleted: (response) => {
                if (response.deleteResource.errors) {
                    // FIXME: handle error
                }
            },
            // FIXME: handle error
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
