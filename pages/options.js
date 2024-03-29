let firefox = typeof browser != 'undefined'
let bots = []
let usernameColumn;
let idColumn;

function addText(element, text, options){
	// Get element name to create
	let elementName = options && options.customElement || `span`

	// Create new HTML element newElement
	let newElement = document.createElement(elementName);

	// Modify text and append newElement to given element
	newElement.textContent = text;
	element.appendChild(newElement);
}

function breakLine(element){
	// Create br element and append to given element
	let br = document.createElement(`br`);
	element.appendChild(br);
}

function displayBots(){
	// Add Username and User ID header to columns
	addText(usernameColumn, `Username`, {customElement: `b`})
	addText(idColumn, `User ID`, {customElement: `b`})

	// Loop through all bots
	for(let k in bots){
		if(k == 0){ continue }
		let botId = bots[k][0];
		let botUsername = bots[k][1];

		breakLine(usernameColumn);
		addText(usernameColumn, botUsername);

		breakLine(idColumn);
		addText(idColumn, botId);
	}
}

async function getBotList(){
	// Pings the browser with {showBots: true} and returns the awaited response
	if(firefox){
		return await browser.runtime.sendMessage({showBots: true})
	}

	return await new Promise(resolve => {
		chrome.runtime.sendMessage({
			showBots: true
		}, function(res) {
			resolve(res)
		})
	})
}

async function main(){
	bots = await getBotList();

	// Modify stat paragraph to include the # of bots listed on our gist
	document.getElementById("stat").firstChild.nodeValue = `There are ${bots.length} known bot accounts and while we try our best to carefully investigate every user reported, mistakes do happen. Appeals can be made in our Discord server.`
	
	// Modify list header to include the # of bots listed on our gist as well
	document.getElementById("list-header-text").firstChild.firstChild.firstChild.nodeValue += ` (${bots.length})`

	// Handle clicks for element button `showbots`
	document.getElementById("showbots").onclick = function(){
		document.getElementById("showbots").remove()
		displayBots();
	}
}

window.onload = function(){
	// Get id and username column for bot list on the page
	idColumn = document.getElementById("botcol1");
	usernameColumn = document.getElementById("botcol2");
	
	main()
}

