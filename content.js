// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("runtime listener called!");
    // If the received message has the expected format...
    console.log(msg);
    if (msg.text === 'report_back') {
        console.log("reporting back!");
        console.log(document.all[0].outerHTML);
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        sendResponse(document.all[0].outerHTML);
    }
});
