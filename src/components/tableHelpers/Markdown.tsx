import React from 'react';
import MarkdownEditor from '#components/MarkdownEditor';

export interface MarkdownProps {
    value: string | null | undefined;
    className?: string;
}
function MarkdownCell(props: MarkdownProps) {
    const {
        value,
        className,
    } = props;

    return (
        <MarkdownEditor
            value={value}
            name="update"
            readOnly
            className={className}
        />
    );
}
export default MarkdownCell;
