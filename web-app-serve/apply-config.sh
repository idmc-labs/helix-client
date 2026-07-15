#!/bin/env bash

set -xe

# Substitute WEB_APP_SERVE_PLACEHOLDER__<VAR> markers with runtime values.
# Based on the base image's default-app-apply-config.sh, but for the
# REACT_APP_ prefix (the default script only handles ^APP_).
while IFS='=' read -r KEY VALUE; do
    # Escape sed replacement metacharacters (\, & and the | delimiter) so
    # URLs/tokens containing them substitute literally
    ESCAPED_VALUE=$(printf '%s' "$VALUE" | sed -e 's/[\\&|]/\\&/g')
    find "$DESTINATION_DIRECTORY" -type f \
        -exec sed -i "s|\<WEB_APP_SERVE_PLACEHOLDER__$KEY\>|$ESCAPED_VALUE|g" {} +
done < <(env | grep '^REACT_APP_')

# Blank unfilled placeholders so a variable omitted at runtime resolves to ""
# (falsy) instead of leaking the literal marker (a truthy string) into the bundle
find "$DESTINATION_DIRECTORY" -type f \
    -exec sed -i 's|WEB_APP_SERVE_PLACEHOLDER__REACT_APP_[A-Za-z0-9_]*||g' {} +
