const { TradingViewAPI } = require("tradingview-scraper");
const http = require("http");

const tv = new TradingViewAPI();

const token = process.env.AUTH_TOKEN;
const symbols = process.env.SYMBOLS;
const hostname = process.env.WEBHOOK_HOSTNAME;
const port = process.env.WEBHOOK_PORT;
const webhookPath =  process.env.WEBHOOK_PATH;

if (token) {
    tv.setAuthToken(token);
}

tv.setup().then(() => {
    let subscriptions = symbols.split(",").map(symbol => {
	return tv.getTicker(symbol);
    });
    Promise.all(subscriptions).then(tickers => {
	tickers.forEach(ticker => {
	    let last = 0;
	    ticker.on("update", data => {
		if (data.lp && data.lp !== last) {
		    const d = JSON.stringify({
			"ticker": ticker.simpleOrProName,
			"price": data.lp,
		    });
		    const req = http.request({
			hostname: hostname,
			port: port,
			path: webhookPath,
			method: "POST",
			headers: {
			    'Content-Type': 'application/json',
			    'Content-Length': d.length,
			}
		    }, res => {
			console.log(res.statusCode);
		    });
		    req.on("error", console.log);
		    req.write(d);
		    req.end();
		    last = data.lp;
		}
	    });
	});
    });
});
