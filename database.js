const fs = require('fs');
const { DATA_FILE } = require('./config');

// Shape of data.json:
// {
//   "coins": { "<userId>": 123 },
//   "inventory": { "<userId>": ["mystery_box", "mystery_box"] },
//   "inviteUses": { "<guildId>": { "<inviteCode>": <uses> } },
//   "invitedBy": { "<newMemberId>": "<inviterId>" }   // who invited whom (for stats / anti-abuse)
// }

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { coins: {}, inventory: {}, inviteUses: {}, invitedBy: {}, containers: {} };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!data.containers) data.containers = {}; // safe upgrade for older data.json files
  return data;
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getBalance(userId) {
  const data = load();
  return data.coins[userId] || 0;
}

function addCoins(userId, amount) {
  const data = load();
  data.coins[userId] = (data.coins[userId] || 0) + amount;
  save(data);
  return data.coins[userId];
}

function removeCoins(userId, amount) {
  const data = load();
  const current = data.coins[userId] || 0;
  if (current < amount) return null; // insufficient funds
  data.coins[userId] = current - amount;
  save(data);
  return data.coins[userId];
}

function addItem(userId, itemId) {
  const data = load();
  if (!data.inventory[userId]) data.inventory[userId] = [];
  data.inventory[userId].push(itemId);
  save(data);
}

function getInventory(userId) {
  const data = load();
  return data.inventory[userId] || [];
}

function getGuildInviteUses(guildId) {
  const data = load();
  return data.inviteUses[guildId] || {};
}

function setGuildInviteUses(guildId, codeUsesMap) {
  const data = load();
  data.inviteUses[guildId] = codeUsesMap;
  save(data);
}

function setInviter(newMemberId, inviterId) {
  const data = load();
  data.invitedBy[newMemberId] = inviterId;
  save(data);
}

function getInviteCount(userId) {
  const data = load();
  return Object.values(data.invitedBy).filter(inviterId => inviterId === userId).length;
}

function getContainerInfo(userId) {
  const data = load();
  return data.containers[userId] || null;
}

function setContainerInfo(userId, info) {
  const data = load();
  data.containers[userId] = info;
  save(data);
}

function getUsedPorts() {
  const data = load();
  return Object.values(data.containers).map(c => c.port);
}

function getContainerCount() {
  const data = load();
  return Object.keys(data.containers).length;
}

function getAllContainers() {
  const data = load();
  return data.containers; // { userId: { containerName, port, password, createdAt, suspended?, suspendedAt? } }
}

function markContainerSuspended(userId) {
  const data = load();
  if (data.containers[userId]) {
    data.containers[userId].suspended = true;
    data.containers[userId].suspendedAt = Date.now();
    save(data);
  }
}

module.exports = {
  getBalance, addCoins, removeCoins,
  addItem, getInventory,
  getGuildInviteUses, setGuildInviteUses,
  setInviter, getInviteCount,
  getContainerInfo, setContainerInfo, getUsedPorts,
  getContainerCount, getAllContainers, markContainerSuspended,
};
