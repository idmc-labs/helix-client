import React, { useCallback } from 'react';

import { Accordion } from '@togglecorp/toggle-ui';
import { MutationUpdaterFn } from '@apollo/client';

import styles from './styles.css';
import ResourceItem from '../ResourceItem';

import {
    DeleteResourceMutation,
    ResourcesQuery,
} from '#generated/types';

type ResourceType = NonNullable<NonNullable<ResourcesQuery['resourceList']>[number]>;

interface GroupTitleProps {
    title: string,
}

function GroupTitle(props: GroupTitleProps) {
    const {
        title,
    } = props;
    return (
        <div className={styles.resourceGroupTitle}>
            {title}
        </div>
    );
}

const getKeySelectorId = (res: ResourceType) => res.id;

const getGroupKeySelector = (res: ResourceType) => (res.group?.name ?? 'Uncategorized');

interface ResourcesAccordionProps {
    myResourcesList: ResourceType[] | undefined,
    onSetResourceIdOnEdit: (resourceItem: string) => void,
    onRemoveResourceFromCache: MutationUpdaterFn<DeleteResourceMutation>;
}

function ResourcesAccordion(props: ResourcesAccordionProps) {
    const {
        myResourcesList,
        onSetResourceIdOnEdit,
        onRemoveResourceFromCache,
    } = props;

    const getRenderParams = useCallback(
        (key: string, option: ResourceType) => ({
            className: styles.item,
            title: option.name,
            lastAccessedOn: option.lastAccessedOn,
            keyValue: key,
            onSetResourceIdOnEdit,
            onRemoveResourceFromCache,
            url: option.url,
        }),
        [
            onSetResourceIdOnEdit,
            onRemoveResourceFromCache,
        ],
    );

    const getGroupTitleRendereParams = useCallback(
        (key) => ({
            title: key,
        }),
        [],
    );

    if (!myResourcesList) {
        return null;
    }

    return (
        <Accordion
            data={myResourcesList}
            keySelector={getKeySelectorId}
            groupKeySelector={getGroupKeySelector}
            groupTitleRenderer={GroupTitle}
            groupTitleRendererParams={getGroupTitleRendereParams}
            renderer={ResourceItem}
            rendererParams={getRenderParams}
            multipleExpandEnabled
        />
    );
}

export default ResourcesAccordion;
