import React from 'react';

export interface ExternalLinkProps {
    title?: string;
    link?: string;
    className?: string;
}
function ExternalLinkCell(props: ExternalLinkProps) {
    const {
        title,
        link,
        className,
    } = props;

    if (!link) {
        return (
            <div className={className}>
                {title}
            </div>
        );
    }

    return (
        <a
            className={className}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
        >
            {title}
        </a>
    );
}
export default ExternalLinkCell;
