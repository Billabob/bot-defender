let firefox = typeof browser != 'undefined'
let whitelistInput;

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

async function checkIfPatron(){
    let patron = localGet('isPatron').then(res => { return res.isPatron });
    let warningDiv = document.getElementById('warning')
    if(patron){
        warningDiv.style.display = 'none';
        return true;
    }else{
        warningDiv.style.display = 'block';
        return false;
    }
}

async function loadSavedWhitelist(){
    let whitelist = await localGet('whitelist').then(res => { return res.whitelist });
    // format whitelist and load it onto whitelistInput
}

async function saveWhitelist(){
    // get whitelist from whitelistInput, format it and save it to localSet('whitelist', whitelist)
    let whitelist = whitelistInput.value;
    if(whitelist){
        // await localSet('whitelist', whitelist);
        await saveWhitelist();
    }
}

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
    whitelistInput = document.getElementById('whitelist-input').value;

	main()
}