export const enAbort = (p1: Promise<any>) => {
  let abort
  const p2 = new Promise((resolve, reject) => (abort = reject))
  const p = Promise.race([p1, p2])
  return [p, abort] as unknown as [Promise<any>, (reason?: any) => void]
}
  