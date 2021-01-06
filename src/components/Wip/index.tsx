import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.css';

interface WipProps {
    children: React.ReactElement<{ className?: string }>;
}
function Wip(props: WipProps) {
    const {
        children,
    } = props;

    if (process.env.NODE_ENV !== 'production') {
        return null;
    }

    const myProps = {
        className: _cs(styles.wip, children.props.className),
    };

    return React.cloneElement(children, myProps);
}
export default Wip;
