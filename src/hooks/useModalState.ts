import React from 'react';

function useModalState(initialValue = false) {
    const [visible, setVisibility] = React.useState(initialValue);

    const [modalId, setModalId] = React.useState<string | undefined>(undefined);

    const setVisible = React.useCallback(
        (id?: string) => {
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
