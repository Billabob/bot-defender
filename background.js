var print = console.log
var TradesDeclinedTotal = 0
var TradesDeclinedSession = 0
var DecRunningTotal = 0
var GlitchedTrades = {}
var Strikes = {}
var SubscriptionStatus = "unknown"
var PBResult

// Made by billabot
// Join the discord server for bug reports and/or questions: discord.gg/Cn39Ys

chrome.storage.local.get('FirstTime',function(firsttime){
	if(firsttime['FirstTime']==undefined){
		alert("Welcome to Bot Defender! Please click the extension icon then click the blue 'i' for more information on how to get this extension running.")
		chrome.storage.local.set({FirstTime:false});
		chrome.storage.local.set({TradesDeclinedTotal:0});
	}
})

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.a == "lol"){
			chrome.storage.local.get('TradesDeclinedTotal',function(result){
				console.log(result)
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
		if(request.a == "resetlocal"){
			TradesDeclinedSession = 0
		}
		if(request.a == "substatus"){
			if(SubscriptionStatus=="unknown"){
				var VIPLink = 'https://www.roblox.com/private-server/instance-list-json?universeId=1884689868&page=1'
				var VIPXHR = new XMLHttpRequest()
				VIPXHR.open("GET", VIPLink, true);
				VIPXHR.onreadystatechange = function() {
					if(VIPXHR.readyState == 4) {
						var servers = (JSON.parse(VIPXHR.responseText)).Instances
						SubscriptionStatus = false
						for(i=0;i<servers.length;i++){
							if(servers[i].DoesBelongToUser && servers[i].IsPrivateServerSubscriptionActive){
								SubscriptionStatus = true
							}
						}
						sendResponse(SubscriptionStatus);
					}
				}
				VIPXHR.send()
			}else{
				sendResponse(SubscriptionStatus);
			}
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
							DecRunningTotal = DecRunningTotal+1
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
						chrome.storage.local.get('TradesDeclinedTotal',function(result){
							if(isNaN(result.TradesDeclinedTotal)){
								chrome.storage.local.set({"TradesDeclinedTotal": Math.max(DecRunningTotal,TradesDeclinedSession)}) // Sets # trades declined to 1 in case there's no saved stat
							}else{
								chrome.storage.local.set({"TradesDeclinedTotal": result.TradesDeclinedTotal+DecRunningTotal})
							}
						})
					}
				}
			}
			inboundXHR.send();
		}
		Page()
	}
	
	// Tries to set the status of ID=1 (Roblox) to nothing. This will fail obviously but I will get the validation token.
	// The token is needed to actually execute an action such as declining a trade
	function GetToken() {
		var statusURL = 'https://users.roblox.com/v1/users/1/status'
		var statusXHR = new XMLHttpRequest();
		statusXHR.open("PATCH", statusURL, true);
		statusXHR.onreadystatechange = function() {
			if (statusXHR.readyState == 4) {
				CompileInbounds(statusXHR.getResponseHeader('X-CSRF-TOKEN'))
			}
		}
		statusXHR.setRequestHeader("Content-Type", "application/json")
		statusXHR.send()
	}
	
	 // Check if you have a VIP server
	function CheckSubscription() {
		var VIPLink = 'https://www.roblox.com/private-server/instance-list-json?universeId=1884689868&page=1'
		var VIPXHR = new XMLHttpRequest()
		VIPXHR.open("GET", VIPLink, true);
		VIPXHR.onreadystatechange = function() {
			if(VIPXHR.readyState == 4) {
				var servers = (JSON.parse(VIPXHR.responseText)).Instances
				SubscriptionStatus = false
				for(i=0;i<servers.length;i++){
					if(servers[i].DoesBelongToUser && servers[i].IsPrivateServerSubscriptionActive){
						SubscriptionStatus = true
						GetToken()
						return
					}
				}
			}
		}
		VIPXHR.send()
	}
	
	// Gets a bot list (from pastebin which allows us to update it)
	function GetBotList() {
		var pasteLink = 'https://pastebin.com/raw/TCTEfEMB'
		var pasteXHR = new XMLHttpRequest()
		pasteXHR.open("GET", pasteLink, true);
		pasteXHR.onreadystatechange = function() {
			if(pasteXHR.readyState == 4) {
				var List = JSON.parse(pasteXHR.responseText)
				PBResult = JSON.parse(pasteXHR.responseText)
				BotList = {};
				for(i = 0; i < List.length; i++) {
					BotList[List[i][0]] = true
				}
				CheckSubscription()
			}
		}
		pasteXHR.setRequestHeader('cache-control', 'public, max-age=300') // it only caches for 5 minutes i.e it becomes outdated for a maximum period of 5 minutes
		pasteXHR.send()
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
				print(GlitchedTrades)
				print(Strikes)
				GetBotList()
			})
		}
	})
}

function Loop(f, minutes) {
    setInterval(f, minutes * 1000 * 60);
}

Loop(DeclineBots, 1)
DeclineBots()