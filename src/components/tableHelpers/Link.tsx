import React from 'react';
import { Link } from 'react-router-dom';
import { isFalsyString } from '@togglecorp/fujs';

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

    if (isFalsyString(link)) {
        return (
            <div className={className}>
                {title}
            </div>
        );
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
