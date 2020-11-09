import React, { useCallback, useMemo } from 'react';
import { useButtonFeatures } from '@togglecorp/toggle-ui';
import { randomString } from '@togglecorp/fujs';

import styles from './styles.css';

type ButtonHookProps = Parameters<typeof useButtonFeatures>[0];

interface FileUploaderProps extends ButtonHookProps, Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange'> {
    className?: string;
    onChange: (v: File[]) => void;
}

function FileUploader(props: FileUploaderProps) {
    const {
        variant,
        className: classNameFromProps,
        actionsClassName,
        iconsClassName,
        childrenClassName,
        transparent = false,
        children: childrenFromProps,
        icons,
        actions,
        uiMode,
        compact,

        onChange,

        ...otherProps
    } = props;

    const name = useMemo(randomString, []);

    const { children, className } = useButtonFeatures({
        variant,
        className: classNameFromProps,
        actionsClassName,
        iconsClassName,
        childrenClassName,
        transparent,
        children: childrenFromProps,
        icons,
        actions,
        uiMode,
        compact,
    });

    const handleChange = useCallback(
        (v: React.ChangeEvent<HTMLInputElement>) => {
            if (!v.target.files) {
                return;
            }
            const files = Array.from(v.target.files);
            if (files.length <= 0) {
                return;
            }

            onChange(files);

            // eslint-disable-next-line no-param-reassign
            v.target.value = '';
        },
        [onChange],
    );

    return (
        <label
            htmlFor={name}
            className={className}
        >
            {children}
            <input
                className={styles.input}
                id={name}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...otherProps}
                type="file"
                onChange={handleChange}
            />
        </label>
    );
}

export default FileUploader;
