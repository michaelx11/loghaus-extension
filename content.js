function scrollGenerator(offset) {
  return function() {
    window.scroll(0, offset);
  }
}

function embedDiv() {
  var div = document.createElement( 'div' );

  var tableOfContents = document.createElement( 'ol' );

  for (var i = 0; i < 10 ; i++) {
    var listElement = document.createElement( 'li' );
    listElement.innerHTML = "really long message item: " + i;
    listElement.onclick = scrollGenerator(i * 1000);
    console.log(listElement);
    tableOfContents.append(listElement);
  }

  //append all elements
  document.body.appendChild( div );
  div.append(tableOfContents);
  //set attributes for div
  div.id = 'myDivId';
  div.style.position = 'fixed';
  div.style.top = '0%';
  div.style.left = '90%';
  div.style.width = '10%';
  div.style.height = '100%';
  div.style.backgroundColor = 'white';
  div.style.opacity = '0.25';
}

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
        embedDiv()
    }
});
