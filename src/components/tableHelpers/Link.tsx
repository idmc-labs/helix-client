import React from 'react';
import { Link } from 'react-router-dom';

export interface LinkProps {
    title?: string | null;
    link?: string | null;
    className?: string;
}
function LinkCell(props: LinkProps) {
    const {
        title,
        link,
        className,
    } = props;
    if (!link) {
        return null;
    }
    return (
        <Link
            className={className}
            to={link}
        >
            {title}
        </Link>
    );
}
export default LinkCell;
