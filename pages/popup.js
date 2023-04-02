let firefox = typeof browser != 'undefined'
let timeSaved = { total: '', session: '' }
let buttonImages = {
	off: chrome.runtime.getURL('content/off.png'),
	on: chrome.runtime.getURL('content/on.png'),
}

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

function calculateTime(n){
	// Create object
	let total = {format: "seconds", time: n*5}
	
	// If less than 60 seconds, return array
	if(total.time < 60){ return total }

	// Get minutes
	let minutes = Math.floor(total.time/60)

	// Check if seconds starts with 0 or not
	total.format = "minutes"
	if(total.time%60>9){
		total.time = `${minutes}:${total.time%60}`
	}else{
		total.time = `${minutes}:0${total.time%60}`
	}

	// If less than 60 minutes, return array
	if(minutes < 60){ return total }

	// Check if minutes starts with 0 or not
	total.format = "hours"
	if(minutes%60>9){
		total.time = `${Math.floor(minutes/60)}:${minutes%60}`
	}else{
		total.time = `${Math.floor(minutes/60)}:0${minutes%60}`
	}

	return total
}

async function _switch() {
	// switch is a reserve word
	let button = document.getElementById("onbutton")

	// Switch button.src to on/off and set it to chrome.local
	if(button.src == buttonImages.on){
		button.src = buttonImages.off
		await localSet('isiton', false)
	}else{
		button.src = buttonImages.on
		await localSet('isiton', true)
	}
}

async function getDeclined(){
	// Arrange object
	let declined = {
		total: (await localGet('TradesDeclinedTotal').then(res => res.TradesDeclinedTotal || 0)),
	};

	// Pings the browser for the # of trades declined this session
	if(firefox){
		declined.session = await browser.runtime.sendMessage({getSessionDeclined:true})
	}else{
		declined.session = await new Promise(r => { 
			chrome.runtime.sendMessage({getSessionDeclined:true}, (response) => { r(response) })
		})
	}

	// Check if object values exist, otherwise make them 0
	declined.total = declined.total || 0;
	declined.session = declined.session || 0;
	
	return declined
}

async function setState(){
	// Check if `isiton` is initialised
	let initialised = await localGet('isiton').then(res => isNaN(res.isiton) || res.isiton)

	// If not, display off image
	if(!initialised){ document.getElementById("onbutton").src = buttonImages.off }
}

function displayTimeSaved(declined){
	// Check if element exists
	if(document.getElementById("total") == null){ return }
	
	// Display # of trades declined
	document.getElementById("total").firstChild.nodeValue = declined.total
	document.getElementById("session").firstChild.nodeValue = declined.session

	// Calculate and display time saved
	let results = {total: calculateTime(declined.total), local: calculateTime(declined.session)}
	timeSaved.total = `Saved you ${results.total.time} ${results.total.format} in total`
	timeSaved.session = `Saved you ${results.local.time} ${results.local.format} in this session`
}

function mouseHandlers(){
	let time = document.getElementById("time")
	
	// What the hell?
	document.getElementById("onbutton").onclick = function(){_switch()}
	document.getElementById("help").onclick = function(){ chrome.tabs.create({'url': "/pages/options.html" }) }
	document.getElementById("discord").onclick = function(){ chrome.tabs.create({'url': "https://discord.gg/qJpQdkW" }) }
	document.getElementById("column1").onmouseout = function(){time.style = "color:#202020"}
	document.getElementById("column2").onmouseout = function(){time.style = "color:#202020"}
	
	document.getElementById("settings-button").onclick = async function(){
		// Show config.html file
		chrome.tabs.create({'url': "/pages/config.html" });
		return;
	}

	document.getElementById("column1").onmousemove = function(){
		time.firstChild.nodeValue = timeSaved.session;
		time.style = "color:#FFFFFF";
	}
	document.getElementById("column2").onmousemove = function(){
		time.firstChild.nodeValue = timeSaved.total;
		time.style = "color:#FFFFFF";
	}
}


window.onload = async function(){
	// Sets on/off state
	await setState();

	// Gets and displayes session + total declined trades
	let declined = await getDeclined();
	displayTimeSaved(declined);

	// Handle mouseEvents
	mouseHandlers();
}