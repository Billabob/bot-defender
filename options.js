function run(){
	chrome.runtime.sendMessage({
		showBots:true
	}, function(bots) {
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
	});
}

window.onload = function(){
	run()
}

