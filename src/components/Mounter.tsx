import { useEffect } from 'react';

interface Props {
    listenUnmount?: boolean,
    onChange: (value: boolean) => void;
}

function Mounter(props: Props) {
    const {
        listenUnmount,
        onChange,
    } = props;

    useEffect(
        () => {
            onChange(true);
            return () => {
                if (listenUnmount) {
                    onChange(false);
                }
            };
        },
        [onChange, listenUnmount],
    );

    return null;
}

export default Mounter;
