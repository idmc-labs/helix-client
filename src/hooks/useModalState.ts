import React from 'react';

function useModalState<T = string>(initialValue = false) {
    const [visible, setVisibility] = React.useState(initialValue);

    const [modalId, setModalId] = React.useState<T | undefined>(undefined);

    const setVisible = React.useCallback(
        (id?: T) => {
            setVisibility(true);
            setModalId(id);
        },
        [],
    );

    const setHidden = React.useCallback(
        () => {
            setVisibility(false);
            setModalId(undefined);
        },
        [],
    );

    const toggle = React.useCallback(
        () => {
            setVisibility((value) => !value);
            setModalId(undefined);
        },
        [],
    );

    return [visible, modalId, setVisible, setHidden, toggle] as const;
}

export default useModalState;
