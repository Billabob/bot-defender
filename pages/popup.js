let timeSaved = { total: '', session: '' }
let buttons = {
	off: chrome.runtime.getURL('content/off.png'),
	on: chrome.runtime.getURL('content/on.png'),
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
	let declined = await new Promise(resolve => {
        chrome.runtime.sendMessage({
            getDeclined: true
        },function(response) {
            resolve(response)
        })
    })
	
	await new Promise(resolve => {
		chrome.storage.local.get('isiton',function(result){
			let isiton = isNaN(result.isiton) || result.isiton
			chrome.storage.local.set({isiton:isiton});
			
			if(!isiton){
				document.getElementById("onbutton").src = buttons.off
			}
			
			resolve(isiton)
		})
	})
	
	if(declined == undefined){ declined = {total:0,sesh:0} }
	if(document.getElementById("tot") == null){ return }
	
	document.getElementById("tot").innerHTML = declined.total
	document.getElementById("sesh").innerHTML = declined.sesh

	let res = {total: CalculateTime(declined.total), local: CalculateTime(declined.sesh)}
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