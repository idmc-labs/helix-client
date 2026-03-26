import { useEffect } from 'react';

export default function useDocumentTitle(title: string) {
    useEffect(() => {
        const cleanup = () => {
            document.title = 'Helix 2.0';
        };
        document.title = title;
        return cleanup;
    }, [title]);
}
