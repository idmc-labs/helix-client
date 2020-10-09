import React, { useCallback, useMemo } from 'react';
import {
    IoIosCreate,
} from 'react-icons/io';

import {
    Accordion,
} from '@togglecorp/toggle-ui';

import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

import { Resource } from '../myResources.interface';

interface ResourceItemProps {
    title: string,
    lastAccessedOn: string,
    onSetResourceIdOnEdit: (id: string) => void,
    url: string,
    resourceHovered: string,
    onHandleSetResourceHovered: (id: string) => void,
    onHandleResetResourceHovered: () => void,
    keyValue: string,
}

function ResourceItem(props: ResourceItemProps) {
    const {
        title,
        lastAccessedOn,
        keyValue,
        onSetResourceIdOnEdit,
        url,
        resourceHovered,
        onHandleSetResourceHovered,
        onHandleResetResourceHovered,
    } = props;

    const isHoveredResource = useMemo(
        () => resourceHovered && keyValue === resourceHovered, [keyValue, resourceHovered],
    );

    const onHandleResourceHovered = useCallback(() => {
        onHandleSetResourceHovered(keyValue);
    }, [keyValue, onHandleSetResourceHovered]);

    const onHandleCancelResourceHovered = useCallback(() => {
        onHandleResetResourceHovered();
    }, [onHandleResetResourceHovered]);

    const onSetEditableResourceItemId = useCallback(() => {
        onSetResourceIdOnEdit(keyValue);
    }, [keyValue, onSetResourceIdOnEdit]);

    return (
        <div
            className={styles.resourceItemContainer}
            onMouseEnter={onHandleResourceHovered}
            onMouseLeave={onHandleCancelResourceHovered}
        >
            <div className={styles.firstRow}>
                <a
                    href={url}
                    className={styles.title}
                    rel="noreferrer"
                    target="_blank"
                >
                    {title}
                </a>
                {isHoveredResource && (
                    <QuickActionButton
                        onClick={onSetEditableResourceItemId}
                        name="edit-resource"
                        className={styles.headerButtons}
                    >
                        <IoIosCreate />
                    </QuickActionButton>
                )}
            </div>
            <p className={styles.lastAccessedOn}>
                {`Last accessed: ${lastAccessedOn}`}
            </p>
        </div>
    );
}

interface ResourcesAccordionProps {
    myResourcesList: Resource[],
    onSetResourceIdOnEdit: (resourceItem: string) => void,
    resourceHovered: string,
    onHandleSetResourceHovered: (id: string) => void,
    onHandleResetResourceHovered: () => void,
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
        resourceHovered,
        onHandleSetResourceHovered,
        onHandleResetResourceHovered,
    } = props;

    const getRenderParams = useCallback(
        (key, option) => ({
            title: option.name,
            lastAccessedOn: option.lastAccessedOn,
            keyValue: key,
            onSetResourceIdOnEdit,
            url: option.url,
            resourceHovered,
            onHandleSetResourceHovered,
            onHandleResetResourceHovered,
        }),
        [
            onSetResourceIdOnEdit,
            resourceHovered,
            onHandleSetResourceHovered,
            onHandleResetResourceHovered,
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
