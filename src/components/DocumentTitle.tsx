import { useEffect } from 'react';

export interface DocumentTitleProps {
    value: string;
}

function DocumentTitle({ value }: DocumentTitleProps) {
    useEffect(
        () => {
            document.title = value;
        },
        [value],
    );
    return null;
}

export default DocumentTitle;
