export const logger = {
  info: (...args: unknown[]) => console.info('[I-Track]', ...args),
  warn: (...args: unknown[]) => console.warn('[I-Track]', ...args),
  error: (...args: unknown[]) => console.error('[I-Track]', ...args)
}
