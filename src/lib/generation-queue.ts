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
