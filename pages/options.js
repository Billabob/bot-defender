let bots = []

function addbots(n){
	// bad code
	document.getElementById("botcol1").innerHTML=document.getElementById("botcol1").innerHTML+bots[n][0]+"<br>";
	document.getElementById("botcol2").innerHTML=document.getElementById("botcol2").innerHTML+bots[n][1]+"<br>";
	if(n<15){
		setTimeout(function(){addbots(n+1)},100)
	}else{
		let rest = ""
		let restN = ""
		function add(n){
			let x = n+15
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

function main(){
	chrome.runtime.sendMessage({
		showBots: true
	}, function(_bots) {
		bots = _bots
		document.getElementById("stat").innerHTML=`There are ${bots.length} known bot accounts and while we try our best to carefully investigate every user reported, mistakes do happen. Appeals can be made in our Discord server.`
		document.getElementById("showbots").onclick = function(){
			document.getElementById("showbots").remove()
			document.getElementById("botcol1").innerHTML="<b>User ID</b><br>"; 
			document.getElementById("botcol2").innerHTML="<b>Username</b><br>"
			addbots(1); //yes i know arrays start at 0, i just don't want cotten eye joe displaying
		}
	});
}

window.onload = function(){
	main()
}

