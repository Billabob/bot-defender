let declined = { session: 0, running: 0 }
let GlitchedTrades = {}
let Strikes = {}
let SubscriptionStatus = "unknown"
let raw_botList = {}
let csrf_token
let botList = {}

// Made by billabot
// Join the discord server for bug reports and/or questions: discord.gg/qJpQdkW

chrome.storage.local.get('FirstTime',function(result){
	if(result.FirstTime == undefined){
		alert("Welcome to Bot Defender! Please click the extension icon then click the blue 'i' for information on how to get this extension running.")
		chrome.storage.local.set({FirstTime:false});
		chrome.storage.local.set({TradesDeclinedTotal:0});
	}
})

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.getDeclined){
			chrome.storage.local.get('TradesDeclinedTotal',function(result){
				let tot = result.TradesDeclinedTotal || 0
				sendResponse({
					total: tot,
					sesh: declined.session
				})
			})
		}
		
		if(request.showBots){ sendResponse( raw_botList ) }
		
		return true
	}
);

async function initialise() {
	// initialise
	return await new Promise(resolve => {
		chrome.storage.local.get('isiton', async function(result){
			if(result.isiton == undefined){
				result.isiton = true
				chrome.storage.local.set({isiton:true});
			}else if(!result.isiton){
				resolve(false)
			}
			
			await new Promise(resolve => {
				chrome.storage.local.get('GlitchedTrades', async function(result){
					GlitchedTrades = result.GlitchedTrades || {}
					resolve(true)
				})
			})
			resolve(true)
		})
	})
}

async function checkCache(){
	return await new Promise(resolve => {
		chrome.storage.local.get('TradesDeclinedTotal',function(result){
			if(isNaN(result.TradesDeclinedTotal)){
				chrome.storage.local.set({'TradesDeclinedTotal': Math.max(1,declined.session)}) // Sets # trades declined to 1 in case there's no saved stat
			}
			resolve()
		})
	})	
}

async function getBotList() {
	let result = await fetch('https://gist.githubusercontent.com/codetariat/03043d47689a6ee645366d327b11944c/raw/')
	.then(res=>res.json())
	
	raw_botList = result
	
	botList = {}
	for(let k in result){
		botList[result[k][0]] = result[k][1]
	}

	// For the inbounds page
	chrome.storage.local.set({'BotList': botList})
}

// Get all inbound trades
async function compileInbounds() {
	let inbounds = []
	let npc = ""

	while(npc != null){
		let result = await fetch("https://trades.roblox.com/v1/trades/inbound?cursor=" + npc + "&limit=100&sortOrder=Desc")
		.then(res => res.json())
		inbounds = inbounds.concat(result.data)
		npc = result.nextPageCursor
	}

	return inbounds
}

async function filterBots(inbounds){
	DecRunningTotal = 0
	for(let k in inbounds){
		if(botList[inbounds[k].user.id] && !GlitchedTrades[inbounds[k].id]){ // If the sender is on the bot list... then decline
			await declineTrade(inbounds[k].id)
		}
	}

	await new Promise(resolve => {
		setTimeout(function(){chrome.storage.local.get('TradesDeclinedTotal',function(result){
			if(isNaN(result.TradesDeclinedTotal)){
				chrome.storage.local.set({"TradesDeclinedTotal": Math.max(declined.running,declined.session)}) // Sets # trades declined to 1 in case there's no saved stat
			}else{
				chrome.storage.local.set({"TradesDeclinedTotal": result.TradesDeclinedTotal+declined.running})
			}
			resolve()
		})},1000)
	})
}

async function declineTrade(id, ttl = 5) {
	let resp = await fetch(`https://trades.roblox.com/v1/trades/${id}/decline`,{
		method: 'POST',
		headers: new Headers({'X-CSRF-TOKEN':  csrf_token}),
	})
	
	if(resp.status == 200){
		declined.session++ // Adds one to # of trades declined this session
		declined.running++ // Adds another to the total
	}

	if(resp.status == 400){
		Strikes[id] = Strikes[id] + 1 || 1
		if(Strikes[id]==3){ //third strike, stop attempting to decline
			GlitchedTrades[id]=true
			chrome.storage.local.set({GlitchedTrades:GlitchedTrades})
		}
	}

	if(resp.status == 403){
		let _json = await resp.json();
		if(_json.errors && _json.errors[0].code == 0 && ttl >= 0){
			// csrf token (which is needed to execute an action) is outdated and we need to get a new one and retry
			csrf_token = resp.headers.get('x-csrf-token')
			await declineTrade(id, ttl--);
		}
	}
}

let running = false;

async function main(){
	if(running){ return }
	try {
		let initialised = await initialise()
		if(!initialised){return} // extension turned off
		running = true;
		await checkCache()
		await getBotList()
		let trades = await compileInbounds()
		await filterBots(trades)
	} catch {
		// catch exception error etc
	} finally {
		running = false;
	}
}

main();
setInterval(main, 1 * 1000 * 60); // run main() every 60 seconds