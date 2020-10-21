import React, { useCallback, useMemo } from 'react';
import {
    IoIosCreate,
} from 'react-icons/io';

import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

interface ResourceItemProps {
    title: string,
    lastAccessedOn: string,
    onSetResourceIdOnEdit: (id: string) => void,
    url: string,
    resourceHovered: string | undefined,
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
        () => resourceHovered && keyValue === resourceHovered,
        [keyValue, resourceHovered],
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
            {/* FIXME: use date/time formatter */}
            <p className={styles.lastAccessedOn}>
                {`Last accessed: ${lastAccessedOn}`}
            </p>
        </div>
    );
}

export default ResourceItem;
