import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import HCaptcha from '@hcaptcha/react-hcaptcha';

import { InputContainer, InputContainerProps } from '@togglecorp/toggle-ui';

import styles from './styles.css';

export type HCaptchaProps<T> = Omit<InputContainerProps, 'input'> & {
    name: T,
    siteKey: string;
    onChange: (value: string | undefined, name: T) => void;
    elementRef?: React.RefObject<HCaptcha>;
};

function HCaptchaInput<T extends string>(props: HCaptchaProps<T>) {
    const {
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
        uiMode,

        name,
        siteKey,
        onChange,
        elementRef,
    } = props;

    const handleVerify = useCallback(
        (token: string) => {
            onChange(token, name);
        },
        [onChange, name],
    );
    const handleError = useCallback(
        (err: string) => {
            console.error(err);
            onChange(undefined, name);
        },
        [onChange, name],
    );
    const handleExpire = useCallback(
        () => {
            onChange(undefined, name);
        },
        [onChange, name],
    );

    return (
        <InputContainer
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={_cs(className, styles.inputContainer)}
            disabled={disabled}
            error={error}
            errorContainerClassName={errorContainerClassName}
            hint={hint}
            hintContainerClassName={hintContainerClassName}
            icons={icons}
            iconsContainerClassName={iconsContainerClassName}
            inputSectionClassName={_cs(inputSectionClassName, styles.inputSection)}
            inputContainerClassName={styles.input}
            label={label}
            labelContainerClassName={labelContainerClassName}
            readOnly={readOnly}
            uiMode={uiMode}
            input={(
                <HCaptcha
                    ref={elementRef}
                    // disabled={disabled || readOnly}
                    sitekey={siteKey}
                    onVerify={handleVerify}
                    onError={handleError}
                    onExpire={handleExpire}
                />
            )}
        />
    );
}

export default HCaptchaInput;
