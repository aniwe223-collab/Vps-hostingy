const { execFile } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const execFileP = promisify(execFile);

const { DOCKER } = require('../config');
const {
  getContainerInfo, setContainerInfo, getUsedPorts,
  getContainerCount, getAllContainers, markContainerSuspended,
} = require('../database');

function generatePassword(length = 16) {
  // URL-safe-ish, no characters that are annoying to type over SSH
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, length);
}

function allocatePort() {
  const used = new Set(getUsedPorts());
  const [start, end] = DOCKER.PORT_RANGE;
  for (let port = start; port <= end; port++) {
    if (!used.has(port)) return port;
  }
  throw new Error('No free ports left in the configured range — increase DOCKER.PORT_RANGE in config.js.');
}

// Creates a new container for this user, or returns their existing one if they already have it.
async function createUserContainer(userId) {
  const existing = getContainerInfo(userId);
  if (existing) return existing;

  if (getContainerCount() >= DOCKER.MAX_CONTAINERS) {
    throw new Error(`The maximum number of VPS containers (${DOCKER.MAX_CONTAINERS}) has already been reached.`);
  }

  const port = allocatePort();
  const password = generatePassword();
  const containerName = `vps-${userId}`;

  try {
    await execFileP('docker', [
      'run', '-d',
      '--name', containerName,
      '--memory', DOCKER.MEMORY,
      '--cpus', DOCKER.CPUS,
      '--restart', 'unless-stopped',
      '-p', `${port}:22`,
      '-e', `ROOT_PASSWORD=${password}`,
      DOCKER.IMAGE,
    ]);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error('Docker is not installed (or not in PATH) on this server.');
    }
    // Most common real cause: the image hasn't been built yet, or the port is somehow taken
    throw new Error(`docker run failed: ${err.stderr || err.message}`);
  }

  const info = { containerName, port, password, createdAt: Date.now() };
  setContainerInfo(userId, info);
  return info;
}

// Stops (docker stop) any container that's older than DOCKER.SUSPEND_AFTER_DAYS and not
// already marked suspended. Safe to call repeatedly — already-suspended ones are skipped.
async function checkAndSuspendExpiredContainers() {
  const containers = getAllContainers(); // { userId: info }
  const maxAgeMs = DOCKER.SUSPEND_AFTER_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const [userId, info] of Object.entries(containers)) {
    if (info.suspended) continue;
    if (now - info.createdAt < maxAgeMs) continue;

    try {
      await execFileP('docker', ['stop', info.containerName]);
      markContainerSuspended(userId);
      console.log(`Suspended VPS for user ${userId} (${info.containerName}) after ${DOCKER.SUSPEND_AFTER_DAYS} days.`);
    } catch (err) {
      console.error(`Failed to suspend container ${info.containerName}:`, err.stderr || err.message);
    }
  }
}

module.exports = { createUserContainer, allocatePort, generatePassword, checkAndSuspendExpiredContainers };
