import React, { useRef, FormEvent, useCallback } from 'react';
import { TextArea } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface AutoTextAreaProps {
    onChange?: (value: string | undefined, name: string, e: FormEvent<HTMLTextAreaElement>) => void;
    value: string | null | undefined;
    className?: string;
}

function AutoTextArea(props: AutoTextAreaProps) {
    const {
        onChange,
        value,
        className,
        ...otherProps
    } = props;
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    // TODO: handle height change in loading data on form edit
    const onTextChange = useCallback((
        textValue: string | undefined,
        name: string,
        event: FormEvent<HTMLTextAreaElement>,
    ) => {
        if (onChange) {
            onChange(textValue, name, event);
        }
        const currentTextArea = textAreaRef?.current;
        if (currentTextArea?.style) {
            currentTextArea.style.cssText = 'height:auto; padding:0';
            if (currentTextArea.scrollHeight) {
                console.log(currentTextArea.scrollHeight);
                currentTextArea.style.cssText = `height:${currentTextArea.scrollHeight}px`;
            }
        }
    }, [onChange]);

    return (
        <TextArea
            elementRef={textAreaRef}
            className={_cs(className, styles.textarea)}
            name="textarea"
            id="textarea"
            onChange={onTextChange}
            {...otherProps}
            value={value}
        />
    );
}

export default AutoTextArea;
