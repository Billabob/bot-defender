var TotalTime = "0:00"
var SessionTime = "0:00"

function run(){
	chrome.runtime.sendMessage({
			a:"lol"
		}, function(declined) {
		chrome.storage.local.get('isiton',function(isiton){
			if(isNaN(isiton['isiton'])){
				isiton = true
				chrome.storage.local.set({isiton:true});
			}else{isiton=isiton['isiton']}
			if(!isiton){
				document.getElementById("onbutton").src=chrome.runtime.getURL('off.png')
			}
			var TotalDeclined; var TotalDeclined
			if(declined == undefined){
				declined = {total:0,sesh:0}
			}
			if(document.getElementById("tot") == null){
				return
			}
			document.getElementById("tot").innerHTML = declined.total
			document.getElementById("sesh").innerHTML = declined.sesh
			function CalculateTime(n){
				var totformat = "seconds"
				var tottime = n*5
				if(tottime>59){
					var m = Math.floor(tottime/60)
					if(tottime%60>9){
						tottime = m+":"+tottime%60
					}else{
						tottime = m+":0"+tottime%60
					}
					totformat = "minutes"
					if(m>59){
						if(m%60>9){
							tottime = Math.floor(m/60)+":"+m%60
						}else{
							tottime = Math.floor(m/60)+":0"+m%60
						}
						totformat = "hours"
					}
				}
				return [tottime,totformat]
			}
			var aa = CalculateTime(declined.total);
			TotalTime = "Saved you "+aa[0]+" "+aa[1]+" in total"
			var ab = CalculateTime(declined.sesh);
			SessionTime = "Saved you "+ab[0]+" "+ab[1]+" in this session"
			
			function turn() {
				var but = document.getElementById("onbutton")
				if(but.src==chrome.runtime.getURL('on.png')){
					but.src=chrome.runtime.getURL('off.png')
					chrome.storage.local.set({isiton:false});
					document.getElementById("sesh").innerHTML = "0"
					SessionTime = "Saved you 0 seconds in this session"
					chrome.runtime.sendMessage({a:"resetlocal"});
				}else{
					but.src=chrome.runtime.getURL('on.png')
					chrome.storage.local.set({isiton:true});
				}
			}
			
			document.getElementById("onbutton").onclick = function(){turn()}
			document.getElementById("help").onclick = function(){chrome.tabs.create({'url': "/options.html" })}
			var timeele = document.getElementById("time")
			document.getElementById("column1").onmousemove = function(){time.innerHTML = SessionTime; time.style = "color:#FFFFFF"}
			document.getElementById("column2").onmousemove = function(){time.innerHTML = TotalTime; time.style = "color:#FFFFFF"}
			document.getElementById("column1").onmouseout = function(){time.style = "color:#202020"}
			document.getElementById("column2").onmouseout = function(){time.style = "color:#202020"}
		})
	})
}

window.onload = function(){
	run()
}