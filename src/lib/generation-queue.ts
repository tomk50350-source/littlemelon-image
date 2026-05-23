let activeGenerations = 0;

type QueueEntry = {
  slots: number;
  max: number;
  resolve: () => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

const waitQueue: QueueEntry[] = [];
const DEFAULT_QUEUE_TIMEOUT_MS = 1000 * 60 * 15;

export async function runWithGenerationLimit<T>(limit: number, task: () => Promise<T>): Promise<T> {
  const [result] = await runBatchWithGenerationLimit(limit, [task]);
  return result;
}

export async function runBatchWithGenerationLimit<T>(limit: number, tasks: Array<() => Promise<T>>): Promise<T[]> {
  const max = Math.max(1, Math.floor(limit));
  const slots = tasks.length;

  if (slots < 1) return [];

  if (slots > max) {
    throw new Error(`当前后台并发上限是 ${max}，本次请求需要同时生成 ${slots} 张。请在后台把“同时生成上限”调到 ${slots} 或更高。`);
  }

  await acquireGenerationSlots(max, slots);
  try {
    const settled = await Promise.allSettled(tasks.map((task) => task()));
    const rejected = settled.find((item) => item.status === "rejected");
    if (rejected?.status === "rejected") throw rejected.reason;
    return settled.map((item) => (item as PromiseFulfilledResult<T>).value);
  } finally {
    releaseGenerationSlots(slots);
  }
}

function acquireGenerationSlots(max: number, slots: number): Promise<void> {
  if (waitQueue.length === 0 && activeGenerations + slots <= max) {
    activeGenerations += slots;
    return Promise.resolve();
  }

  const timeoutMs = getQueueTimeoutMs();
  return new Promise((resolve, reject) => {
    const entry: QueueEntry = {
      slots,
      max,
      resolve,
      reject,
      timer: setTimeout(() => {
        removeQueueEntry(entry);
        reject(new Error(`当前生成排队超过 ${Math.round(timeoutMs / 60000)} 分钟，请稍后再试；本次失败不会扣积分。`));
      }, timeoutMs)
    };

    entry.timer.unref?.();
    waitQueue.push(entry);
    drainQueue();
  });
}

function releaseGenerationSlots(slots: number) {
  activeGenerations = Math.max(0, activeGenerations - slots);
  drainQueue();
}

function drainQueue() {
  while (waitQueue.length > 0) {
    const next = waitQueue[0];
    if (activeGenerations + next.slots > next.max) return;

    waitQueue.shift();
    clearTimeout(next.timer);
    activeGenerations += next.slots;
    next.resolve();
  }
}

function removeQueueEntry(entry: QueueEntry) {
  const index = waitQueue.indexOf(entry);
  if (index >= 0) waitQueue.splice(index, 1);
}

function getQueueTimeoutMs() {
  const raw = Number(process.env.GENERATION_QUEUE_TIMEOUT_MS || DEFAULT_QUEUE_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_QUEUE_TIMEOUT_MS;
}
