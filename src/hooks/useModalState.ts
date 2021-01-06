import React from 'react';

function useModalState(initialValue = false): [
    boolean,
    string | undefined,
    (id?: string) => void,
    () => void,
    React.Dispatch<React.SetStateAction<boolean>>,
] {
    const [visible, setVisibility] = React.useState(initialValue);
    const [modalId, setModalId] = React.useState<string>();
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
    return [visible, modalId, setVisible, setHidden, setVisibility];
}

export default useModalState;
