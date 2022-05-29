let firefox = typeof browser != 'undefined'
let whitelistInput;
let patron;

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

// this function checks if the user is a patron
async function checkIfPatron(){
    patron = await localGet('isPatron').then(res => { return res.isPatron || false });
    
    let warningDiv = document.getElementById('warning')
    if(patron){
        warningDiv.style.display = 'none';
        return true;
    }else{
        warningDiv.style.display = 'block';
        return false;
    }
}

// this function loads the saved whitelist and displays it in the whitelist input field + saved whitelist div
async function loadSavedWhitelist(){
    let whitelist = await localGet('whitelist').then(res => { return res.whitelist });
    if(!whitelist){ return }
    let savedWhitelistDiv = document.getElementById('saved-whitelist')

    // declare usersString variable
    let usersString = ''
    // loop through whitelist
    for(let k in whitelist){
        let user = whitelist[k];
        // add username and userId to usersString
        usersString += `${user.username}, ${user.userId}`
        usersString += '\n'

        // add username and userId to savedWhitelistDiv
        addText(savedWhitelistDiv, `${user.username}, ${user.userId}`)
        breakLine(savedWhitelistDiv)
    }

    // set whitelistInput value to usersString
    whitelistInput.value = usersString
}

// this function saves the whitelist to local storage upon clicking the save button
async function saveWhitelist(){
    let input = whitelistInput.value;
    let splitInput = input.split(`\n`)
    let userArray = []

    if(splitInput[0].split(',').length < 2){ userArray = [];
        await localSet('whitelist', userArray)
        return;
    }

    for(let k in splitInput){
        userArray[k] = {username: splitInput[k].split(',')[0].trim(), userId: splitInput[k].split(',')[1].trim()}
    }

    await localSet('whitelist', userArray)
}

// this function loads the clickhandler for the save button
async function loadClickhandlerSaveButton(){
    document.getElementById('save-whitelist').onclick = saveWhitelist;
}

async function main(){
    let patron = await checkIfPatron();
    if(!patron){ return }

    await loadSavedWhitelist();
    await loadClickhandlerSaveButton();
}

window.onload = function(){
    // Initialise config.js page variables
    whitelistInput = document.getElementById('whitelist-input');

	main()
}