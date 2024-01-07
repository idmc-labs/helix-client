import React, { useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import { useBooleanState } from '@togglecorp/toggle-ui';

import styles from './styles.css';

function useSidebarLayout(showInitially = false) {
    const [showSidebar, setShowSidebarTrue, setShowSidebarFalse] = useBooleanState(showInitially);
    return useMemo(
        () => ({
            showSidebar,
            setShowSidebarTrue,
            setShowSidebarFalse,
            // This container will get squished
            // Note the display property will be flex for this
            containerClassName: _cs(styles.content, showSidebar && styles.sidebarShown),

            // This container will be the sidebar
            sidebarClassName: _cs(styles.sidebar, showSidebar && styles.shown),

            // This reserves space for the sidebar
            // and should be immideately inside the container
            sidebarSpaceReserverElement: <div className={styles.sidebarReservedSpace} />,
        }),
        [showSidebar, setShowSidebarFalse, setShowSidebarTrue],
    );
}

export default useSidebarLayout;
