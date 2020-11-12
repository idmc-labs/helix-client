import { createContext } from 'react';

import { Notification } from '#types';

export interface NotificationContextProps {
    notify: (notification: Notification) => string;
}

const NotificationContext = createContext<NotificationContextProps>({
    notify: () => {
        console.warn('notification not initialized yet!');
        return '';
    },
});

export default NotificationContext;
