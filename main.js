let TradesDeclinedTotal = 0
let TradesDeclinedSession = 0
let DecRunningTotal = 0
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
					sesh: TradesDeclinedSession
				})
			})
		}
		
		if(request.showBots){ sendResponse( raw_botList ) }
		if(request.resetLocal){ TradesDeclinedSession = 0 }
		
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
				chrome.storage.local.set({'TradesDeclinedTotal': Math.max(1,TradesDeclinedSession)}) // Sets # trades declined to 1 in case there's no saved stat
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

// Tries to set the status of id=1 (Roblox) to nothing. This will fail obviously but I will get the validation token.
// The token is needed to actually execute an action such as declining a trade
async function authenticate() {
	let resp = await fetch('https://users.roblox.com/v1/users/1/status', {
		method: 'PATCH',
		headers: new Headers({'content-type': 'application/json'}),
		body: JSON.stringify({status: ''})
	})
	
	csrf_token = resp.headers.get('x-csrf-token')
	return csrf_token
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
				chrome.storage.local.set({"TradesDeclinedTotal": Math.max(DecRunningTotal,TradesDeclinedSession)}) // Sets # trades declined to 1 in case there's no saved stat
			}else{
				chrome.storage.local.set({"TradesDeclinedTotal": result.TradesDeclinedTotal+DecRunningTotal})
			}
			resolve()
		})},1000)
	})
}

async function declineTrade(id) {
	let resp = await fetch('https://trades.roblox.com/v1/trades/' + id + '/decline',{
		method: 'POST',
		headers: new Headers({'X-CSRF-TOKEN':  csrf_token}),
		body: JSON.stringify({status: ''})
	})
	
	if(resp.status == 200){
		TradesDeclinedSession++ // Adds one to # of trades declined this session
		DecRunningTotal++ // Adds another to the total
	}

	if(resp.status == 400){
		Strikes[id] = Strikes[id] + 1 || 1
		if(Strikes[id]==3){ //third strike, stop attempting to decline
			GlitchedTrades[id]=true
			chrome.storage.local.set({GlitchedTrades:GlitchedTrades})
		}
	}
}

async function main(){
	let initialised = await initialise()
	if(!initialised){return} // extension turned off

	await checkCache()
	await getBotList()
	await authenticate()
	let trades = await compileInbounds()
	await filterBots(trades)
}

main();
setInterval(main, 1 * 1000 * 60); // run main() every 60 seconds