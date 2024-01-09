import ReactDOM from 'react-dom';
import React from 'react';

interface PortalProps {
    parentNode?: Element | null | undefined;
    children: React.ReactNode | null | undefined;
}

function Portal(props: PortalProps) {
    const {
        parentNode = document.body,
        children,
    } = props;

    if (!parentNode) {
        return null;
    }

    return ReactDOM.createPortal(children, parentNode);
}

export default Portal;
