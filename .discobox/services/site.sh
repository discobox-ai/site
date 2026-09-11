#!/usr/bin/env bash
#---
# name: Site
# description: The Astro dev server for discobox.ai, reloading on every save.
# port: 4321
# protocol: http
#---
set -euo pipefail

cd "$(dirname "$0")/../.."

# A new box has no node_modules. When they are already current this is a quick
# check; the purge flag stops pnpm asking before it rebuilds a stale tree, since
# a service has nobody to answer.
pnpm install --frozen-lockfile --config.confirm-modules-purge=false

# Astro 7 moves the dev server into the background when it detects an AI agent
# from the environment, and a box's environment can look like one. A service
# whose process exits is shown as exited and never restarted, so keep it in the
# foreground. ASTRO_DEV_BACKGROUND is how Astro's own background child skips
# that detection; the detector itself has no opt-out.
export ASTRO_DEV_BACKGROUND=1

# --host binds every interface, so the forward reaches it however localhost
# resolves.
exec pnpm dev --host
