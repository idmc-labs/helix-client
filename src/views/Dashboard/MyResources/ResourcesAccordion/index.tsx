import React, { useCallback } from 'react';

import {
    Accordion,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';
import ResourceItem from '../ResourceItem';
import { Resource } from '../myResources.interface';

interface ResourcesAccordionProps {
    myResourcesList: Resource[],
    onSetResourceIdOnEdit: (resourceItem: string) => void,
}

const getKeySelectorId = (res: Resource) => res.id;

const getGroupKeySelector = (res: Resource) => (res.group?.name ?? 'Uncategorized');

interface GroupTitleProps {
    title: string,
}

function GroupTitle(props: GroupTitleProps) {
    const {
        title,
    } = props;
    return (
        <p className={styles.resourceGroup}>
            {title}
        </p>
    );
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
        }), [],
    );

    return (
        <Accordion
            data={myResourcesList}
            keySelector={getKeySelectorId}
            groupKeySelector={getGroupKeySelector}
            groupTitleRenderer={GroupTitle}
            groupTitleRendererParams={getGroupTitleRendereParams}
            renderer={ResourceItem}
            rendererParams={getRenderParams}
        />
    );
}

export default ResourcesAccordion;
