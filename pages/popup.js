let timeSaved = { total: '', session: '' }
let buttons = {
	off: chrome.runtime.getURL('content/off.png'),
	on: chrome.runtime.getURL('content/on.png'),
}

async function localGet(key){
	return await new Promise(resolve => { chrome.storage.local.get(key,function(result){
		resolve(result)
	})})
}

function CalculateTime(n){
	let total = {format: "seconds", time: n*5}
	if(total.time>59){
		let m = Math.floor(total.time/60)
		if(total.time%60>9){
			total.time = m+":"+total.time%60
		}else{
			total.time = m+":0"+total.time%60
		}
		total.format = "minutes"
		if(m>59){
			if(m%60>9){
				total.time = Math.floor(m/60)+":"+m%60
			}else{
				total.time = Math.floor(m/60)+":0"+m%60
			}
			total.format = "hours"
		}
	}
	return total
}

function _switch() {
	// switch is a reserved word
	let but = document.getElementById("onbutton")
	if(but.src == buttons.on){
		but.src = buttons.off
		chrome.storage.local.set({isiton:false});
	}else{
		but.src = buttons.on
		chrome.storage.local.set({isiton:true});
	}
}

async function run(){
	let declined = {
		total: (await localGet('TradesDeclinedTotal').then(res => res.TradesDeclinedTotal || 0)),
		session: (await new Promise(r => { chrome.runtime.sendMessage({getSessionDeclined:true}, (response) => { r(response) })}))
	};

	let isiton = await localGet('isiton').then(res => isNaN(res.isiton) || res.isiton)
	if(!isiton){ document.getElementById("onbutton").src = buttons.off }
	
	if(declined == undefined){ declined = {total:0,session:0} }
	if(document.getElementById("total") == null){ return }
	
	document.getElementById("total").innerHTML = declined.total
	document.getElementById("session").innerHTML = declined.session

	let res = {total: CalculateTime(declined.total), local: CalculateTime(declined.session)}
	timeSaved.total = `Saved you ${res.total.time} ${res.total.format} in total`
	timeSaved.session = `Saved you ${res.local.time} ${res.local.format} in this session`
	
	document.getElementById("onbutton").onclick = function(){_switch()}
	document.getElementById("help").onclick = function(){chrome.tabs.create({'url': "pages/options.html" })}
	document.getElementById("column1").onmousemove = function(){time.innerHTML = timeSaved.session; time.style = "color:#FFFFFF"}
	document.getElementById("column2").onmousemove = function(){time.innerHTML = timeSaved.total; time.style = "color:#FFFFFF"}
	document.getElementById("column1").onmouseout = function(){time.style = "color:#202020"}
	document.getElementById("column2").onmouseout = function(){time.style = "color:#202020"}
}

window.onload = function(){
	run()
}