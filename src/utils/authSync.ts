const EMITTER = 'helix-auth-state';

let authenticated = false;

function reload(event: StorageEvent) {
    // NOTE: ignoring action of unsetting localStorage
    if (!event.newValue) {
        return;
    }
    if (event.key === EMITTER && String(authenticated) !== event.newValue) {
        // eslint-disable-next-line no-alert
        const shouldReload = window.confirm(
            authenticated
                ? 'You have been logged out from another tab. Do you want to reload?'
                : 'You have logged in on another tab. Do you want to reload?',
        );
        if (shouldReload) {
            window.location.reload(true);
        }
    }
}

export function sync(val: boolean) {
    authenticated = val;
    // NOTE: just sending auth information
    localStorage.setItem(EMITTER, String(val));
    localStorage.removeItem(EMITTER);
}

export function register() {
    window.addEventListener('storage', reload, false);
}
