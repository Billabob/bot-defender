let firefox = typeof browser != 'undefined'
let glitchedTrades = {};
const strikes = {};

let declined = { session: 0, running: 0 }
let unprocessedBotList = {}
let botList = {}
let whitelist = {}

let csrfToken

// Made by billabot
// Join the discord server for bug reports and/or questions: discord.gg/qJpQdkW

// Chrome Listener
chrome.runtime.onMessage.addListener( async function(request, sender, sendResponse) {	
	// Request to get session declined from popup.js	
	if(request.getSessionDeclined){
		if(firefox){ return Promise.resolve(declined.session); }
		sendResponse(declined.session)
	}

	// Request to show bots from options.js
	if(request.showBots){
		if(firefox){ return Promise.resolve(unprocessedBotList); }
		sendResponse(unprocessedBotList)
	}
})

async function localGet(key){
	return await new Promise(resolve => { 
		chrome.storage.local.get(key,function(result){ resolve(result) })
	})
}

async function localSet(key, data){
	return await new Promise(resolve => {
		chrome.storage.local.set({[key]: data}, function(result){ resolve(result) })
	})
}

async function checkFirstTime(){
	// Get FirstTime saved variable
	let firstTime = await localGet(`FirstTime`)

	// If not undefined then return
	if(firstTime.FirstTime != undefined){ return }

	// Alert and set FirstTime to false
	alert("Welcome to Bot Defender! Please click the extension icon then click the blue 'i' for information on how to get this extension running.")
	await localSet('FirstTime', false)
	await localSet('TradesDeclinedTotal', 0)
}

async function initialise() {
	// Initialise extension
	let enabled = await localGet('isiton').then(res => res.isiton)
	if(enabled == undefined){
		enabled = true
		await localSet('isiton', true)
	}

	glitchedTrades = await localGet('glitchedTrades').then(res => res.glitchedTrades || {})
	return enabled
}

async function checkCache(){
	let res = await localGet('TradesDeclinedTotal').then(res => res.TradesDeclinedTotal)
	if(!isNaN(res)){ return true }
	await localSet('TradesDeclinedTotal', Math.max(1,declined.session)) // Sets # trades declined to 1 in case there's no saved stat
}

// This function gets the bot list from the gist and saves it to local storage
async function getBotList() {
	let result = await fetch('https://gist.githubusercontent.com/codetariat/03043d47689a6ee645366d327b11944c/raw/').then(res=>res.json())
	unprocessedBotList = result
	botList = {}
	for(let k in result){
		botList[result[k][0]] = result[k][1]
	}
	await localSet('BotList', botList) // For the inbounds page
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

const queue = {};

async function filterBots(inbounds){
	let delay = await localGet('delay').then(res => res.delay || 0);
	delay = Number(delay);

	declined.running = 0;
	for(let k in inbounds){
		if(queue[inbounds[k].id]){ continue }
		if(glitchedTrades[inbounds[k].id]){ continue }
		if(whitelist[inbounds[k].user.id]){ continue }

		if(botList[inbounds[k].user.id]){ // If the sender is on the bot list... then decline
			if(delay > 0){
				queue[inbounds[k].id] = true;
				setTimeout(async function(){ await declineTrade(inbounds[k].id) }, delay * 1000)
			}else{
				await declineTrade(inbounds[k].id)
			}
		}
	}

	let res = await localGet('TradesDeclinedTotal').then(res => res.TradesDeclinedTotal)
	if(isNaN(res)){
		await localSet('TradesDeclinedTotal', Math.max(declined.running,declined.session)) // Sets # trades declined to 1 in case there's no saved stat
	}else{
		await localSet('TradesDeclinedTotal', res + declined.running)
	}
}

async function declineTrade(id, ttl = 5) {
	let resp = await fetch(`https://trades.roblox.com/v1/trades/${id}/decline`,{
		method: 'POST',
		headers: new Headers({'X-CSRF-TOKEN':  csrfToken}),
	})

	// remove from queue
	delete queue[id];
	
	if(resp.status == 200){
		declined.session++; declined.running++ // Adds one to # of trades declined this session and total
		return true;
	}
	
	if(resp.status == 400){
		strikes[id] = strikes[id] + 1 || 1
		if(strikes[id] < 3){ return; }
		
		// Third strike, stop attempting to decline
		glitchedTrades[id]=true
		await localSet(glitchedTrades, glitchedTrades)
		return false;
	}
	
	if(resp.status == 403){
		let _json = await resp.json();
		let error = _json?.errors?.[0]?.code
		if( (error == 0 || error == 9001) && ttl >= 0){
			// CSRF token (which is needed to execute an action) is outdated and we need to get a new one and retry
			csrfToken = resp.headers.get('x-csrf-token')
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
		await checkFirstTime(); // Check if user is running the extension for the first time
		let initialised = await initialise() // Initialise extension
		if(!initialised){return} // Extension is turned off
		running = true;
		await checkCache()
		await getBotList()
		let trades = await compileInbounds()
		await filterBots(trades)
	} catch (err) {
		// Catch exception error
		console.trace(`CAUGHT ERROR: ${err}`)
	} finally {
		running = false;
	}
}

getBotList(); // Get bot list once
main();
setInterval(main, 1 * 1000 * 60); // Run main() every 60 seconds