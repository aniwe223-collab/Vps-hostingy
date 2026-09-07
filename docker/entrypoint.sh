#!/bin/bash
set -e

# ROOT_PASSWORD is injected by the bot when it starts each container (see lib/docker.js)
echo "root:${ROOT_PASSWORD}" | chpasswd

exec /usr/sbin/sshd -D
