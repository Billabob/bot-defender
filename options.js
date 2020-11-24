var print = console.log

function run(){
	chrome.runtime.sendMessage({
			a:"bots plz"
		}, function(bots) {
			
		console.log(bots)
		//document.getElementById("discordbutton").onclick = function(){chrome.tabs.create({'url': "https://discord.gg/B4WdMa" })}
		//document.getElementById("subscribebutton").onclick = function(){chrome.tabs.create({'url': "https://www.roblox.com/games/1397656271/Tower-Climb#!/game-instances" })}
		document.getElementById("showbots").onclick = function(){
			document.getElementById("showbots").remove()
			document.getElementById("botcol1").innerHTML="<b>User ID</b><br>"; 
			document.getElementById("botcol2").innerHTML="<b>Username</b><br>"
			function addbots(n){
				document.getElementById("botcol1").innerHTML=document.getElementById("botcol1").innerHTML+bots[n][0]+"<br>";
				document.getElementById("botcol2").innerHTML=document.getElementById("botcol2").innerHTML+bots[n][1]+"<br>";
				if(n<15){
					setTimeout(function(){addbots(n+1)},100)
				}else{
					var rest = ""
					var restN = ""
					function add(n){
						var x = n+15
						if(n<bots.length-15){
							rest = rest+bots[x][0]+"<br>"
							restN = restN+bots[x][1]+"<br>"
							add(n+1)
						}else{
							document.getElementById("botcol1").innerHTML=document.getElementById("botcol1").innerHTML+rest
							document.getElementById("botcol2").innerHTML=document.getElementById("botcol2").innerHTML+restN
						}
					}
					add(1)
				}
			}
			addbots(1); //yes i know arrays start at 0, i just don't want cotten eye joe displaying
			
		}
		chrome.runtime.sendMessage({
			a:"substatus"
		}, function(substatus) {
			if(substatus){
				document.getElementById("substatus").innerHTML="Subscription status: active"
				document.getElementById("substatus").style="color:green"
			}else{
				document.getElementById("substatus").innerHTML="Subscription status: inactive"
				document.getElementById("substatus").style="color:red"
			}
		})
	});
}

window.onload = function(){
	setTimeout(run, 100)
}