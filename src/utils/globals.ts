declare global {
	var unixNow: () => number;
}

globalThis.unixNow = () => ~~(Date.now() / 1000);
