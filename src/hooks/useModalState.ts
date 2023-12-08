import { useCallback, useState } from 'react';

function useModalState<T = string>(
    initialValue = false,
    options?: { onOpen: () => void },
) {
    const onOpen = options?.onOpen;
    const [visible, setVisibility] = useState(initialValue);

    const [modalId, setModalId] = useState<T | undefined>(undefined);

    const setVisible = useCallback(
        (id?: T) => {
            setVisibility(true);
            setModalId(id);
            if (onOpen) {
                onOpen();
            }
        },
        [onOpen],
    );

    const setHidden = useCallback(
        () => {
            setVisibility(false);
            setModalId(undefined);
        },
        [],
    );

    const toggle = useCallback(
        () => {
            setVisibility((value) => !value);
            setModalId(undefined);
        },
        [],
    );

    return [visible, modalId, setVisible, setHidden, toggle] as const;
}

export default useModalState;
