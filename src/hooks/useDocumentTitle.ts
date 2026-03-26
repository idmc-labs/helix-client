import { useEffect } from 'react';
import { isNotDefined, noOp } from '@togglecorp/fujs';

export default function useDocumentTitle(title: string | undefined) {
    useEffect(() => {
        if (isNotDefined(title)) {
            return noOp;
        }
        const cleanup = () => {
            document.title = 'Helix 2.0';
        };
        document.title = title;
        return cleanup;
    }, [title]);
}
