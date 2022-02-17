let declined = { session: 0, running: 0 }
let GlitchedTrades = {}, Strikes = {}
let raw_botList = {}, botList = {}
let csrf_token

// Made by billabot
// Join the discord server for bug reports and/or questions: discord.gg/qJpQdkW

async function localGet(key){
	return await new Promise(resolve => { chrome.storage.local.get(key,function(result){ resolve(result) })})
}

localGet('FirstTime')
.then(res => {
	if(res.FirstTime == undefined){
		alert("Welcome to Bot Defender! Please click the extension icon then click the blue 'i' for information on how to get this extension running.")
		chrome.storage.local.set({FirstTime:false});
		chrome.storage.local.set({TradesDeclinedTotal:0});
	}
})

chrome.runtime.onMessage.addListener( async function(request, sender, sendResponse) {			
	if(request.getSessionDeclined){ sendResponse(declined.session) }
	if(request.showBots){ sendResponse(raw_botList) }
})

async function initialise() {
	// initialise
	let enabled = await localGet('isiton').then(res => res.isiton)
	if(enabled == undefined){
		enabled = true
		chrome.storage.local.set({isiton:true});
	}

	GlitchedTrades = await localGet('GlitchedTrades').then(res => res.GlitchedTrades || {})
	return enabled
}

async function checkCache(){
	let res = await localGet('TradesDeclinedTotal').then(res => res.TradesDeclinedTotal)
	if(!isNaN(res)){ return true }
	chrome.storage.local.set({'TradesDeclinedTotal': Math.max(1,declined.session)}) // Sets # trades declined to 1 in case there's no saved stat
}

async function getBotList() {
	let result = await fetch('https://gist.githubusercontent.com/codetariat/03043d47689a6ee645366d327b11944c/raw/').then(res=>res.json())
	raw_botList = result
	botList = {}
	for(let k in result){
		botList[result[k][0]] = result[k][1]
	}
	chrome.storage.local.set({'BotList': botList}) 	// For the inbounds page
}

// Get all inbound trades
async function compileInbounds() {
	let inbounds = [], npc = ""

	while(npc != null){
		let result = await fetch(`https://trades.roblox.com/v1/trades/inbound?cursor=${npc}&limit=100&sortOrder=Desc`).then(res => res.json())
		inbounds = inbounds.concat(result.data)
		npc = result.nextPageCursor
	}

	return inbounds
}

async function filterBots(inbounds){
	declined.running = 0;
	for(let k in inbounds){
		if(botList[inbounds[k].user.id] && !GlitchedTrades[inbounds[k].id]){ // If the sender is on the bot list... then decline
			await declineTrade(inbounds[k].id)
		}
	}

	let res = await localGet('TradesDeclinedTotal').then(res => res.TradesDeclinedTotal)
	if(isNaN(res)){
		chrome.storage.local.set({"TradesDeclinedTotal": Math.max(declined.running,declined.session)}) // Sets # trades declined to 1 in case there's no saved stat
	}else{
		chrome.storage.local.set({"TradesDeclinedTotal": result.TradesDeclinedTotal+declined.running})
	}
}

async function declineTrade(id, ttl = 5) {
	let resp = await fetch(`https://trades.roblox.com/v1/trades/${id}/decline`,{
		method: 'POST',
		headers: new Headers({'X-CSRF-TOKEN':  csrf_token}),
	})
	
	if(resp.status == 200){
		declined.session++; declined.running++ // Adds one to # of trades declined this session and total
		return true // return success
	}else if(resp.status == 400){
		Strikes[id] = Strikes[id] + 1 || 1
		if(Strikes[id]==3){ //third strike, stop attempting to decline
			GlitchedTrades[id]=true
			chrome.storage.local.set({GlitchedTrades:GlitchedTrades})
		}
	}else if(resp.status == 403){
		let _json = await resp.json();
		if(_json.errors && _json.errors[0].code == 0 && ttl >= 0){
			// csrf token (which is needed to execute an action) is outdated and we need to get a new one and retry
			csrf_token = resp.headers.get('x-csrf-token')
			await declineTrade(id, ttl-1);
		}else{
			throw `403 @ trades/${id}/decline` // throw error
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

getBotList(); 
main(); // get bot list once
setInterval(main, 1 * 1000 * 60); // run main() every 60 seconds