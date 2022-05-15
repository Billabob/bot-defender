const icon = " 🤖"
var botList

function processCards(node) {
    let headshotURL = node
        .querySelector(".avatar-headshot a")
        .getAttribute("href")
    headshotURL = new URL(headshotURL)

    const userId = headshotURL.pathname.split('/')[2]
    
    if (botList[userId]) {
        node.querySelector('.text-lead').innerText += icon
    }
}

let observer = new MutationObserver(mutations => {
    for (let mutation of mutations) {
        console.log(`mutation of mutations found`)
        for (let node of mutation.addedNodes) {
            console.log(`node of mutation.addedNodes found`)
            if (!(node instanceof HTMLElement)) continue
            if (node.matches('.trade-row')) {
                processCards(node)
            }
        }
    }
});

(async () => {
    // I gotta play by the rules of this wicked game
    chrome.storage.local.get('BotList', resp => {
        botList = resp.BotList
        observer.observe(document, { childList: true, subtree: true});
    })
})();