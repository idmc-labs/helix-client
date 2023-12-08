import React, { useState, useCallback } from 'react';
import { InputContainer, InputContainerProps } from '@togglecorp/toggle-ui';
import Markdown from 'react-mde';
import MarkdownView, { MarkdownViewProps } from 'react-showdown';

export const markdownOptions: MarkdownViewProps['options'] = {
    simpleLineBreaks: true,
    headerLevelStart: 3,
    simplifiedAutoLink: true,
    openLinksInNewWindow: true,
    backslashEscapesHTMLTags: true,
    literalMidWordUnderscores: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
};

export function MarkdownPreview(props: MarkdownViewProps) {
    const {
        options: markdownOptionsFromProps,
        ...otherProps
    } = props;
    return (
        <MarkdownView
            {...otherProps}
            options={markdownOptionsFromProps ?? markdownOptions}
        />
    );
}

interface MarkdownEditorProps<K extends string> {
    name: K;
    className?: string;
    readOnly?: boolean;
    disabled?: boolean;
    value: string | null | undefined;
    onChange?:(newVal: string | undefined, name: K) => void;
}

export type Props<K extends string> = Omit<InputContainerProps, 'input'> & MarkdownEditorProps<K>;

function MarkdownEditor<K extends string>(props: Props<K>) {
    const {
        name,
        value,
        onChange,
        actions,
        actionsContainerClassName,
        className,
        disabled,
        error,
        errorContainerClassName,
        hint,
        hintContainerClassName,
        icons,
        iconsContainerClassName,
        inputSectionClassName,
        label,
        labelContainerClassName,
        readOnly,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'write' | 'preview'>('write');
    const handleValueChange = useCallback(
        (newVal) => {
            if (!disabled && !readOnly && onChange) {
                onChange(newVal, name);
            }
        },
        [name, onChange, disabled, readOnly],
    );

    const generateMarkdownPreview = useCallback((markdown: string | undefined) => (
        Promise.resolve(
            <MarkdownPreview
                markdown={markdown ?? ''}
            />,
        )
    ), []);

    return (
        <InputContainer
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            disabled={disabled}
            error={error}
            errorContainerClassName={errorContainerClassName}
            hint={hint}
            hintContainerClassName={hintContainerClassName}
            icons={icons}
            iconsContainerClassName={iconsContainerClassName}
            inputSectionClassName={inputSectionClassName}
            // inputContainerClassName={styles.input}
            label={label}
            labelContainerClassName={labelContainerClassName}
            readOnly={readOnly}
            actions={actions}
            input={!readOnly ? (
                <Markdown
                    value={value ?? ''}
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    onChange={handleValueChange}
                    generateMarkdownPreview={generateMarkdownPreview}
                    readOnly={disabled}
                />
            ) : (
                <MarkdownPreview
                    markdown={value || '-'}
                />
            )}
        />
    );
}

export default MarkdownEditor;
