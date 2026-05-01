/**
 * Run an array of async tasks with a maximum number running at once.
 *
 * We use this for AI Gateway calls (translations) so a single trip or
 * tournament event with many fields / add-ons doesn't fan out into
 * dozens of concurrent requests and trip the upstream rate limit.
 */
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let nextIndex = 0

  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, tasks.length)) }, async () => {
    while (true) {
      const i = nextIndex++
      if (i >= tasks.length) return
      results[i] = await tasks[i]()
    }
  })

  await Promise.all(workers)
  return results
}
