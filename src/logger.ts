const getTimestamp = () => new Date().toLocaleString();

export default {
	log: (...args: any[]) => globalThis.console.log(`[LOG ${getTimestamp()}]`, ...args),
	info: (...args: any[]) => globalThis.console.info(`[INFO ${getTimestamp()}]`, ...args),
	warn: (...args: any[]) => globalThis.console.warn(`[WARN ${getTimestamp()}]`, ...args),
	error: (...args: any[]) => globalThis.console.error(`[ERROR ${getTimestamp()}]`, ...args),
}
