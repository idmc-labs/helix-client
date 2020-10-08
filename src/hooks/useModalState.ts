import React from 'react';

function useModalState(initialValue = false): [
    boolean,
    () => void,
    () => void,
    React.Dispatch<React.SetStateAction<boolean>>,
] {
    const [visible, setVisibility] = React.useState(initialValue);
    const setVisible = React.useCallback(
        () => {
            setVisibility(true);
        },
        [],
    );

    const setHidden = React.useCallback(
        () => {
            setVisibility(false);
        },
        [],
    );

    return [visible, setVisible, setHidden, setVisibility];
}

export default useModalState;
