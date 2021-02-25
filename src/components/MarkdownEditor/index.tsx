import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { InputContainer, InputContainerProps } from '@togglecorp/toggle-ui';
import Markdown from 'react-mde';
import MarkdownView from 'react-showdown';
import 'react-mde/lib/styles/css/react-mde-all.css';

import styles from './styles.css';

interface MarkdownEditorProps<K extends string> {
    name: K;
    className?: string;
    readOnly?: boolean;
    disabled?: boolean;
    value: string | null | undefined;
    onChange?:(newVal: string | undefined, name: K) => void;
}

export type Props<K extends string> = Omit<InputContainerProps, 'input'> & MarkdownEditorProps<K>;

const markdownOptions = {
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

    const [selectedTab, setSelectedTab] = React.useState<'write' | 'preview'>('write');
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
            <MarkdownView
                markdown={markdown ?? ''}
                options={markdownOptions}
            />,
        )
    ), []);

    return (
        <InputContainer
            actionsContainerClassName={actionsContainerClassName}
            className={_cs(styles.markdownEditor, className)}
            disabled={disabled}
            error={error}
            errorContainerClassName={errorContainerClassName}
            hint={hint}
            hintContainerClassName={hintContainerClassName}
            icons={icons}
            iconsContainerClassName={iconsContainerClassName}
            inputSectionClassName={_cs(styles.inputContainer, inputSectionClassName)}
            inputContainerClassName={styles.input}
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
                <MarkdownView
                    markdown={value ?? ''}
                    options={markdownOptions}
                />
            )}
        />
    );
}

export default MarkdownEditor;
