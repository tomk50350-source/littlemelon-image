let activeGenerations = 0;

export async function runWithGenerationLimit<T>(limit: number, task: () => Promise<T>): Promise<T> {
  const max = Math.max(1, limit);
  if (activeGenerations >= max) {
    throw new Error(`当前生成队列已满，最多同时处理 ${max} 个任务，请稍后再试。`);
  }

  activeGenerations += 1;
  try {
    return await task();
  } finally {
    activeGenerations -= 1;
  }
}

export async function runBatchWithGenerationLimit<T>(limit: number, tasks: Array<() => Promise<T>>): Promise<T[]> {
  const max = Math.max(1, Math.floor(limit));
  const slots = tasks.length;

  if (slots < 1) return [];

  if (slots > max) {
    throw new Error(`当前后台并发上限是 ${max}，本次请求需要同时生成 ${slots} 张。请在后台把“同时生成上限”调到 ${slots} 或更高。`);
  }

  if (activeGenerations + slots > max) {
    throw new Error(`当前生成队列已满，最多同时处理 ${max} 张图片，请稍后再试。`);
  }

  activeGenerations += slots;
  try {
    return await Promise.all(tasks.map((task) => task()));
  } finally {
    activeGenerations -= slots;
  }
}
