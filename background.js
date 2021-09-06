var TradesDeclinedTotal = 0
var TradesDeclinedSession = 0
var DecRunningTotal = 0
var GlitchedTrades = {}
var Strikes = {}
var SubscriptionStatus = "unknown"
var PBResult

// Made by billabot
// Join the discord server for bug reports and/or questions: discord.gg/qJpQdkW

chrome.storage.local.get('FirstTime',function(firsttime){
	if(firsttime['FirstTime']==undefined){
		alert("Welcome to Bot Defender! Please click the extension icon then click the blue 'i' for information on how to get this extension running.")
		chrome.storage.local.set({FirstTime:false});
		chrome.storage.local.set({TradesDeclinedTotal:0});
	}
})

chrome.runtime.onMessage.addListener(
	async function(request, sender, sendResponse) {
		
		if (request.getDeclined){
			chrome.storage.local.get('TradesDeclinedTotal',function(result){
				var tot = result.TradesDeclinedTotal
				if(isNaN(result.TradesDeclinedTotal)){
					tot = 0
				}
				sendResponse({
					total: tot,
					sesh: TradesDeclinedSession
				});
			})
		}
		
		if(request.a == "bots plz"){
			sendResponse(PBResult);
		}
		
		if(request.resetLocal){
			TradesDeclinedSession = 0
		}
		
		return true
	}
);

function DeclineBots() {

	// Decline the actual trade
	function DeclineTrade(ID, Token) {
		var DeclineURL = "https://trades.roblox.com/v1/trades/" + ID + "/decline"
		var DeclineXHR = new XMLHttpRequest();
		DeclineXHR.open("POST", DeclineURL, true)
		DeclineXHR.onreadystatechange = function() {
			if(DeclineXHR.readyState == XMLHttpRequest.DONE) {
				var response = JSON.parse(DeclineXHR.response)
				if(DeclineXHR.status == 200){
					TradesDeclinedSession++ // Adds one to # of trades declined this session
					chrome.storage.local.get('TradesDeclinedTotal',function(result){
						if(isNaN(result.TradesDeclinedTotal)){
							chrome.storage.local.set({"TradesDeclinedTotal": Math.max(1,TradesDeclinedSession)}) // Sets # trades declined to 1 in case there's no saved stat
						}else{
							DecRunningTotal++
						}
					})
				}
				if(DeclineXHR.status == 400){
					if(isNaN(Strikes[ID])){
						Strikes[ID] = 1
					}else{
						Strikes[ID]++
						if(Strikes[ID]==3){ //third strike, stop attempting to decline
							GlitchedTrades[ID]=true
							chrome.storage.local.set({GlitchedTrades:GlitchedTrades})
						}
					}
				}
				
				return
			}
		}
		DeclineXHR.setRequestHeader("X-CSRF-TOKEN", Token)
		DeclineXHR.send()
	}
	
	// Get all inbound trades
	function CompileInbounds(Token) {
		var Inbounds = []
		function Page(NPC) {
			if(NPC == undefined) {NPC = ""}
			var inboundURL = "https://trades.roblox.com/v1/trades/inbound?cursor=" + NPC + "&limit=100&sortOrder=Desc"
			var inboundXHR = new XMLHttpRequest();
			inboundXHR.open("GET", inboundURL, true);
			inboundXHR.onreadystatechange = function() {
				if(inboundXHR.readyState == 4) {
					var result = JSON.parse(inboundXHR.response)
					Inbounds = Inbounds.concat(result.data)
					if(result.nextPageCursor != null) {
						Page(result.nextPageCursor)
					} else {
						DecRunningTotal = 0
						for(i = 0; i < Inbounds.length; i++) {
							if(BotList[Inbounds[i].user.id]&&!GlitchedTrades[Inbounds[i].id]){ // If the sender is on the bot list... then decline
								DeclineTrade(Inbounds[i].id, Token)
							}
						}
						setTimeout(function(){chrome.storage.local.get('TradesDeclinedTotal',function(result){
							if(isNaN(result.TradesDeclinedTotal)){
								chrome.storage.local.set({"TradesDeclinedTotal": Math.max(DecRunningTotal,TradesDeclinedSession)}) // Sets # trades declined to 1 in case there's no saved stat
							}else{
								chrome.storage.local.set({"TradesDeclinedTotal": result.TradesDeclinedTotal+DecRunningTotal})
							}
						})},1000)
					}
				}
			}
			inboundXHR.send();
		}
		Page()
	}
	
	// Tries to set the status of ID=1 (Roblox) to nothing. This will fail obviously but I will get the validation token.
	// The token is needed to actually execute an action such as declining a trade
	async function GetToken() {
		let resp = await fetch('https://users.roblox.com/v1/users/1/status', {
			method: 'PATCH',
			headers: new Headers({'content-type': 'application/json'}),
			body: JSON.stringify({status: ''})
		})
		
		let token = resp.headers.get('x-csrf-token')
		return token
	}
	
	async function GetBotList() {
		let preBotList = await fetch('https://gist.githubusercontent.com/codetariat/03043d47689a6ee645366d327b11944c/raw/')
		.then(res=>res.json())
		
		PBResult = preBotList
		
		BotList = {}
		for(let k in preBotList){
			BotList[preBotList[k][0]] = preBotList[k][1]
		}
		
		let token = await GetToken() // not going to go further than this
		CompileInbounds(token)
	}
	
	chrome.storage.local.get('isiton',function(isiton){
		if(isiton['isiton']==undefined){
			isiton['isiton'] = true
			chrome.storage.local.set({isiton:true});
		}
		if(isiton['isiton']){
			chrome.storage.local.get('GlitchedTrades',function(glitched){
				if(glitched['GlitchedTrades']==undefined){
				}else{
					GlitchedTrades = glitched['GlitchedTrades']
				}
				GetBotList()
			})
		}
	})
}

setInterval(DeclineBots, 1 * 1000 * 60); DeclineBots()