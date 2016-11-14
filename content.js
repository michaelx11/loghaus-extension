var documentRange = null;

function scrollGenerator(offset) {
  return function() {
    window.scroll(0, offset);
  }
}

function generateTableOfContents(listHighlights) {
  var tableOfContents = document.createElement( 'ol' );

  for (var i = 0; i < listHighlights.length ; i++) {
    var highlight = listHighlights[i];
    var listElement = document.createElement( 'li' );
    listElement.innerHTML = highlight[1];
    listElement.onclick = scrollGenerator(highlight[2]);
    console.log(listElement);
    tableOfContents.append(listElement);
  }
  console.log(tableOfContents);
  return tableOfContents;
}

function embedDiv(tableOfContents) {
  var div = document.createElement( 'div' );

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
  div.style.opacity = '0.5';
}

function generateRange() {
  documentRange = document.createRange();
}

// This works for log files where the body contains a pre with text
// NOTE: customize this!
function extractTargetElement() {
  return document.body.children[0];
}

function getScrollPositionByOffset(offset) {
  var parentPre = extractTargetElement();
  // The parent pre element contains multiple child text nodes
  var childNodeStartOffset = 0;
  var containingChildNode = null;
  for (var i = 0; i < parentPre.childNodes.length; i++) {
    var childTextNode = parentPre.childNodes[i];
    console.log(childNodeStartOffset + " " + childTextNode.length);
    if (offset >= childNodeStartOffset && offset <= childNodeStartOffset + childTextNode.length) {
      containingChildNode = childTextNode;
      break;
    }
    childNodeStartOffset += childTextNode.length;
  }
  if (!containingChildNode) {
    return null;
  }

  documentRange.setStart(containingChildNode, offset - childNodeStartOffset);
  documentRange.setEnd(containingChildNode, offset - childNodeStartOffset);
  console.log(documentRange);
  var boundingRect = documentRange.getBoundingClientRect();
  console.log(boundingRect);
  return boundingRect.top;
}

// Return [[ruleIndex, shortDescription, offset], ...]
function searchAndComputeIndex(text) {

  var textOffset = text.lastIndexOf("SCHEDULE_WATCHDOG");
  var scrollOffset = getScrollPositionByOffset(textOffset);
  return [[0, "SCHEDULE_WATCHDOG", scrollOffset]];
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("runtime listener called!");
    // If the received message has the expected format...
    console.log(msg);
    if (msg.text === 'report_back') {
        console.log("reporting back!");
//        console.log(document.all[0].outerHTML);
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        generateRange();
//        sendResponse(document.all[0].outerHTML);
        var targetText = extractTargetElement();
//        console.log(targetText);
        var res = searchAndComputeIndex(targetText.textContent);
        var tableOfContents = generateTableOfContents(res);
        embedDiv(tableOfContents);
    }
});
