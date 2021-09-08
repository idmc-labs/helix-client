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
} from '@togglecorp/toggle-ui';

import TagView, { Props as TagViewProps, TagVariant } from '#components/Tag';
import useBooleanState from '#hooks/useBooleanState';

import styles from './styles.css';

interface TagProps extends TagViewProps {
    label: string;
    onRemove: (key: string) => void;
    variant?: TagVariant;
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
        <TagView
            className={_cs(className, styles.tag)}
            actions={!readOnly && (
                <Button
                    name="remove"
                    onClick={handleTagRemove}
                    className={styles.tagButton}
                    childrenClassName={styles.children}
                    disabled={disabled}
                    icons={(
                        <IoClose />
                    )}
                />
            )}
            variant={variant}
            {...otherProps}
        >
            {label}
        </TagView>
    );
}

const keySelector = (d: string) => d;
const emptyValue: string[] = [];

interface Props<N extends string> extends TagViewProps {
    className?: string;
    tagClassName?: string;
    value?: string[] | null | undefined;
    label: string;
    name: N;
    variant?: TagVariant;
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
    const [newTagAddShown, showNewTagAdd, hideNewTagAdd] = useBooleanState(false);

    const handleTagAdd = useCallback(() => {
        if (!newTagValue) {
            setNewTagValue(undefined);
            hideNewTagAdd();
            return;
        }

        const indexToAdd = value?.indexOf(newTagValue);
        if (indexToAdd === -1) {
            if (value) {
                const newValues = [...value];
                newValues.push(newTagValue);
                if (onChange) {
                    onChange(newValues, name);
                }
            }
        }
        setNewTagValue(undefined);
        hideNewTagAdd();
    }, [onChange, value, name, hideNewTagAdd, newTagValue]);

    const handleTagRemove = useCallback((tagToRemove) => {
        const indexToRemove = value?.indexOf(tagToRemove);
        if (indexToRemove !== -1) {
            if (value) {
                const newValues = [...value];
                newValues.splice(indexToRemove, 1);
                if (onChange) {
                    onChange(newValues, name);
                }
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
                    <TagView
                        className={styles.tag}
                        actionsContainerClassName={styles.tagActions}
                        actions={newTagAddShown ? (
                            <>
                                <Button
                                    name="done"
                                    onClick={handleTagAdd}
                                    className={_cs(styles.tagButton, styles.checkButton)}
                                    childrenClassName={styles.children}
                                    disabled={disabled}
                                    icons={(
                                        <IoCheckmarkSharp />
                                    )}
                                />
                                <Button
                                    name="remove"
                                    onClick={handleNewTagAddCancel}
                                    className={_cs(styles.tagButton, styles.cancelButton)}
                                    childrenClassName={styles.children}
                                    disabled={disabled}
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
                    </TagView>
                )}
            </div>
        </div>
    );
}

export default TagInput;
