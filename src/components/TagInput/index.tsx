import React, { useState, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    IoClose,
    IoCheckmarkSharp,
    IoAdd,
} from 'react-icons/io5';
import {
    Button,
    RawInput,
    List,
    Chip,
    ChipProps,
} from '@togglecorp/toggle-ui';

import useBasicToggle from '#hooks/toggleBasicState';

import styles from './styles.css';

interface TagProps extends ChipProps {
    label: string;
    onRemove: (key: string) => void;
    variant?: ChipProps['variant'];
    disabled?: boolean;
    readOnly?: boolean;
    className?: string;
}

function Tag(props: TagProps) {
    const {
        className,
        onRemove,
        label,
        variant,
        disabled,
        readOnly,
        ...otherProps
    } = props;

    const handleTagRemove = useCallback(() => {
        onRemove(label);
    }, [onRemove, label]);

    return (
        <Chip
            className={_cs(className, styles.tag)}
            disabled={disabled}
            action={!readOnly && (
                <Button
                    name="remove"
                    onClick={handleTagRemove}
                    className={styles.tagButton}
                    childrenClassName={styles.children}
                    disabled={disabled}
                    transparent
                    compact
                    title="Remove"
                    icons={(
                        <IoClose />
                    )}
                />
            )}
            variant={variant}
            {...otherProps}
        >
            {label}
        </Chip>
    );
}

const keySelector = (d: string) => d;
const emptyValue: string[] = [];

interface Props<N extends string> extends ChipProps {
    className?: string;
    tagClassName?: string;
    value?: string[] | undefined;
    label: string;
    name: N;
    variant?: ChipProps['variant'];
    onChange?: (newVal: string[], name: N) => void;
    disabled?: boolean;
    readOnly?: boolean;
}

function TagInput<N extends string>(props: Props<N>) {
    const {
        className,
        value = emptyValue,
        onChange,
        name,
        label,
        variant,
        disabled,
        readOnly,
        tagClassName,
        ...otherProps
    } = props;

    const [newTagValue, setNewTagValue] = useState<string | undefined>();
    const [newTagAddShown, showNewTagAdd, hideNewTagAdd] = useBasicToggle();

    const handleTagAdd = useCallback(() => {
        if (!newTagValue) {
            setNewTagValue(undefined);
            hideNewTagAdd();
            return;
        }

        const indexToAdd = value?.indexOf(newTagValue);
        if (indexToAdd === -1) {
            const newValues = [...value];
            newValues.push(newTagValue);
            if (onChange) {
                onChange(newValues, name);
            }
        }
        setNewTagValue(undefined);
        hideNewTagAdd();
    }, [onChange, value, name, hideNewTagAdd, newTagValue]);

    const handleTagRemove = useCallback((tagToRemove) => {
        const indexToRemove = value?.indexOf(tagToRemove);
        if (indexToRemove !== -1) {
            const newValues = [...value];
            newValues.splice(indexToRemove, 1);
            if (onChange) {
                onChange(newValues, name);
            }
        }
    }, [onChange, value, name]);

    const tagRendererParams = useCallback(
        (d) => ({
            label: d,
            onRemove: handleTagRemove,
            variant,
            disabled,
            readOnly,
            className: tagClassName,
            ...otherProps,
        }),
        [handleTagRemove, variant, readOnly, disabled, tagClassName, otherProps],
    );

    const handleNewTagAddCancel = useCallback(() => {
        setNewTagValue(undefined);
        hideNewTagAdd();
    }, [hideNewTagAdd]);

    return (
        <div className={_cs(styles.tagInput, className)}>
            <div className={styles.label}>
                {label}
            </div>
            <div className={styles.tags}>
                {value && value.length > 0 ? (
                    <List
                        data={value}
                        rendererParams={tagRendererParams}
                        renderer={Tag}
                        keySelector={keySelector}
                    />
                ) : (
                    <>
                        {readOnly && (
                            <span className={styles.placeholder}>
                                N/a
                            </span>
                        )}
                    </>
                )}
                {!readOnly && (
                    <Chip
                        disabled={disabled}
                        className={styles.tag}
                        actionClassName={styles.tagActions}
                        action={newTagAddShown ? (
                            <>
                                <Button
                                    name="done"
                                    onClick={handleTagAdd}
                                    className={styles.tagButton}
                                    childrenClassName={styles.children}
                                    disabled={disabled}
                                    transparent
                                    compact
                                    title="Done"
                                    icons={(
                                        <IoCheckmarkSharp />
                                    )}
                                />
                                <Button
                                    name="remove"
                                    onClick={handleNewTagAddCancel}
                                    className={styles.tagButton}
                                    childrenClassName={styles.children}
                                    disabled={disabled}
                                    transparent
                                    compact
                                    title="Remove"
                                    icons={(
                                        <IoClose />
                                    )}
                                />
                            </>
                        ) : (
                            <Button
                                name="add"
                                onClick={showNewTagAdd}
                                className={styles.tagButton}
                                childrenClassName={styles.children}
                                disabled={disabled}
                                compact
                                transparent
                                title="Add"
                                icons={(
                                    <IoAdd />
                                )}
                            />
                        )}
                    >
                        {newTagAddShown && (
                            <RawInput
                                name="newTag"
                                value={newTagValue}
                                onChange={setNewTagValue}
                                autoFocus
                                disabled={disabled}
                            />
                        )}
                    </Chip>
                )}
            </div>
        </div>
    );
}

export default TagInput;
