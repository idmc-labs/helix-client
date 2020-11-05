import React, { useCallback } from 'react';

import {
    Accordion,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';
import ResourceItem from '../ResourceItem';

import {
    // ResourceType,
    ResourcesQuery,
} from '#generated/types';

type ResourceType = NonNullable<NonNullable<NonNullable<ResourcesQuery['resourceList']>['results']>[number]>;

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
}

function ResourcesAccordion(props: ResourcesAccordionProps) {
    const {
        myResourcesList,
        onSetResourceIdOnEdit,
    } = props;

    const getRenderParams = useCallback(
        (key, option) => ({
            title: option.name,
            lastAccessedOn: option.lastAccessedOn,
            keyValue: key,
            onSetResourceIdOnEdit,
            url: option.url,
        }),
        [
            onSetResourceIdOnEdit,
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
