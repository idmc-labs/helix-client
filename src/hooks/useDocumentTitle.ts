import { useEffect } from 'react';
import { isNotDefined } from '@togglecorp/fujs';

export default function useDocumentTitle(title: string | undefined) {
    useEffect(() => {
        if (isNotDefined(title)) {
            return;
        }
        document.title = title;
    }, [title]);
}
