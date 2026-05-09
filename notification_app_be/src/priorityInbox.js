"use strict";
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { fetchNotifications } = require("./services/notificationService");
const { Log } = require("./utils/logger");
const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};
class MinHeap {
  constructor() {
    this._data = [];
  }
  get size() {
    return this._data.length;
  }
  peek() {
    return this._data[0] ?? null;
  }
  push(item) {
    this._data.push(item);
    this._bubbleUp(this._data.length - 1);
  }
  pop() {
    const top = this._data[0];
    const last = this._data.pop();
    if (this._data.length > 0) {
      this._data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this._data[parent].score <= this._data[i].score) break;
      [this._data[parent], this._data[i]] = [this._data[i], this._data[parent]];
      i = parent;
    }
  }
  _sinkDown(i) {
    const n = this._data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this._data[l].score < this._data[smallest].score) smallest = l;
      if (r < n && this._data[r].score < this._data[smallest].score) smallest = r;
      if (smallest === i) break;
      [this._data[i], this._data[smallest]] = [this._data[smallest], this._data[i]];
      i = smallest;
    }
  }
  toSortedDesc() {
    return [...this._data].sort((a, b) => b.score - a.score);
  }
}
const computeScore = (notif, minTs, maxTs) => {
  const weight = TYPE_WEIGHT[notif.Type] || 1;
  const ts = new Date(notif.Timestamp).getTime();
  const recency = maxTs === minTs ? 1 : (ts - minTs) / (maxTs - minTs);
  return weight * 1000 + Math.round(recency * 100);
};

const getTopN = async (n = 10) => {
  await Log("backend", "info", "service", `fetching top ${n} from inbox`);
  const notifications = await fetchNotifications();
  
  if (!notifications || notifications.length === 0) {
    await Log("backend", "warn", "service", "inbox empty");
    return [];
  }
  
  const timestamps = notifications.map(n => new Date(n.Timestamp).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  
  const heap = new MinHeap();
  for (const notif of notifications) {
    const score = computeScore(notif, minTs, maxTs);
    const entry = { score, notif };
    
    if (heap.size < n) {
      heap.push(entry);
    } else if (score > heap.peek().score) {
      heap.pop();
      heap.push(entry);
    }
  }
  
  await Log("backend", "info", "service", `selected top ${heap.size} items`);
  return heap.toSortedDesc().map(({ score, notif }) => ({ ...notif, priorityScore: score }));
};
if (require.main === module) {
  const n = parseInt(process.argv[2] || "10", 10);
  console.log(`\n🔔  Priority Inbox — Top ${n} Notifications\n${"─".repeat(60)}`);
  getTopN(n).then((top) => {
    if (top.length === 0) {
      console.log("  (no notifications found)");
      process.exit(0);
    }
    top.forEach((item, idx) => {
      const rank      = String(idx + 1).padStart(2, " ");
      const type      = item.Type.padEnd(10, " ");
      const score     = String(item.priorityScore).padStart(5, " ");
      const timestamp = item.Timestamp;
      const message   = item.Message;
      console.log(`  ${rank}. [${type}] score=${score}  ${timestamp}  "${message}"`);
    });
    console.log(`${"─".repeat(60)}\n`);
    process.exit(0);
  }).catch((err) => {
    console.error(`[priorityInbox] Fatal: ${err.message}`);
    process.exit(1);
  });
}
module.exports = { getTopN, MinHeap, computeScore };