var documentRange = null;

// === Search helper utilities ===

function generateRange() {
  documentRange = document.createRange();
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
  // We need to compute based on current Y, since the rects are relative
  return window.scrollY + boundingRect.top;
}

function findAllMatches(sourceText, regexStr) {
  console.log("matching with re: " + regexStr);
  var re = new RegExp(regexStr,'gi');

  var results = new Array();//this is the results you want
  while (re.exec(sourceText)){
    results.push(re.lastIndex);
  }
  return results;
}

// Return [[ruleIndex, shortDescription, offset], ...]
function searchAndComputeIndex(text, regexStrings, regexDescriptions) {
  var allMatches = [];
  for (var i = 0; i < regexStrings.length; i++) {
    var regexStr = regexStrings[i];
    var textOffsets = findAllMatches(text, regexStr);
    for (var u = 0; u < textOffsets.length; u++) {
      var scrollOffset = getScrollPositionByOffset(textOffsets[u]);
      allMatches.push([i, regexDescriptions[i], scrollOffset]);
    }
  }

  allMatches.sort(function(a, b) {
    return a[2] - b[2];
  });
  return allMatches;
}

// === UI Helper Utilities ===

function genPastelColor(){
  var r = (Math.round(Math.random()* 127) + 50).toString(16);
  var g = (Math.round(Math.random()* 127) + 50).toString(16);
  var b = (Math.round(Math.random()* 127) + 70).toString(16);
  return '#' + r + g + b;
}

function generateColorList(length) {
  var colors = []
  for (var i = 0; i < length; i++) {
    colors.push(genPastelColor());
  }
  return colors;
}

function scrollGenerator(offset) {
  return function() {
    window.scroll(0, offset);
  }
}

function onMouseOver() {
  this.style.fontWeight = 'bold';
}

function onLeave() {
  this.style.fontWeight = 'normal';
}

function generateTableOfContents(listHighlights, colorList) {
  var tableOfContents = document.createElement( 'ol' );

  for (var i = 0; i < listHighlights.length ; i++) {
    var highlight = listHighlights[i];
    var listElement = document.createElement( 'li' );
    listElement.style.marginBottom = '5px';
    listElement.innerHTML = highlight[1];
    listElement.onclick = scrollGenerator(highlight[2]);
    listElement.onmouseover = onMouseOver;
    listElement.onmouseleave = onLeave;
    listElement.style.color = colorList[highlight[0]];
    console.log(listElement);
    tableOfContents.append(listElement);
  }
  console.log(tableOfContents);
  return tableOfContents;
}

function embedDiv(tableOfContents) {
  var currentDiv = document.getElementById("tableOfContentsDiv");
  if (currentDiv) {
    currentDiv.remove();
  }
  var div = document.createElement('div');

  var header = document.createElement('h3');
  header.innerHTML = 'Highlights';
  header.style.textAlign = 'center';
  header.style.margin = '0px';
  header.style.padding = '0px';
  div.append(header);

  //append all elements
  document.body.appendChild( div );
  div.append(tableOfContents);
  //set attributes for div
  div.id = 'tableOfContentsDiv';
  div.style.position = 'fixed';
  div.style.top = '0%';
  div.style.left = '80%';
  div.style.width = '20%';
  div.style.height = '100%';
  div.style.backgroundColor = 'transparent';
  div.style.opacity = '0.7';
  div.style.overflow = 'scroll';
}

// This works for log files where the body contains a pre with text
// NOTE: customize this!
function extractTargetElement() {
  return document.body.children[0];
}

// --- Full Generation ---

function fullGeneration() {
  chrome.storage.sync.get({
    rulesJsonString: "",
  }, function(items) {
    var rules = JSON.parse(items.rulesJsonString);
    var regexStrings = [];
    var regexDescriptions = [];
    for (var i = 0; i < rules.length; i++) {
      regexStrings.push(rules[i][0]);
      regexDescriptions.push(rules[i][1]);
    }
    console.log(regexStrings);
    console.log(regexDescriptions);
    var colorList = generateColorList(regexStrings.length);
    generateRange();
    var targetText = extractTargetElement();
    var res = searchAndComputeIndex(targetText.textContent, regexStrings, regexDescriptions);
    var tableOfContents = generateTableOfContents(res, colorList);
    embedDiv(tableOfContents);
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log("runtime listener called!");
    // If the received message has the expected format...
    console.log(msg);
    if (msg.text === 'report_back') {
        fullGeneration();
        // Set recompute on resize
        document.body.onresize = fullGeneration
    }
});
