declare global {
	var unixNow: () => number;
	var dateToUnix: (date: Date) => number;
}

globalThis.unixNow = () => Math.trunc(Date.now() / 1000);

globalThis.dateToUnix = (date: Date) => Math.trunc(date.getTime() / 1000);
