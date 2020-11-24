import { useState, useEffect } from 'react';

function useDebouncedValue<T>(input: T, debounceTime?: number) {
    const [debounceValue, setDebouncedValue] = useState(input);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(input);
        }, debounceTime ?? 500);

        return () => {
            clearTimeout(handler);
        };
    }, [input, debounceTime]);

    return debounceValue;
}
export default useDebouncedValue;
