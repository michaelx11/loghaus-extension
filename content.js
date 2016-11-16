// === Search helper utilities ===

function getScrollPositionByOffset(offset) {
  var documentRange = document.createRange();
  var parentPre = extractTargetElement();
  // The parent pre element contains multiple child text nodes
  var childNodeStartOffset = 0;
  var containingChildNode = null;
  for (var i = 0; i < parentPre.childNodes.length; i++) {
    var childTextNode = parentPre.childNodes[i];
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
  var boundingRect = documentRange.getBoundingClientRect();
  // We need to compute based on current Y, since the rects are relative
  return window.scrollY + boundingRect.top;
}

function findAllMatches(sourceText, regexStr) {
  var re = new RegExp(regexStr,'gi');

  var results = new Array();//this is the results you want
  while (re.exec(sourceText)){
    results.push(re.lastIndex);
  }
  return results;
}

// Return timestamp
var LINE_CHAR_LIMIT = 500;
function extractTimestamp(text, offset, timestampRegex) {
  // Walk forward until we hit a newline or beginning of text, up to a limit
  var match = text.substring(Math.max(0, offset - LINE_CHAR_LIMIT), offset).match(timestampRegex);
  // Return error string if no matches
  if (!match || match.length == 0) return "__:__:__";
  return match[match.length - 1]; // get last match
}

// Return [[ruleIndex, shortDescription, offset, timestamp], ...]
function searchAndComputeIndex(text, regexStrings, regexDescriptions, timestampRegex) {
  var allMatches = [];
  for (var i = 0; i < regexStrings.length; i++) {
    var regexStr = regexStrings[i];
    var textOffsets = findAllMatches(text, regexStr);
    for (var u = 0; u < textOffsets.length; u++) {
      var scrollOffset = getScrollPositionByOffset(textOffsets[u]);
      var timestampString = extractTimestamp(text, textOffsets[u], timestampRegex);
      allMatches.push([i, regexDescriptions[i], scrollOffset, timestampString]);
    }
  }

  allMatches.sort(function(a, b) {
    return a[2] - b[2];
  });
  return allMatches;
}

// === UI Helper Utilities ===

// http://stackoverflow.com/questions/28860602/pleasing-palette-random-color-generation
function randomColor(){
  var golden_ratio_conjugate = 0.618033988749895,
      h = (Math.random() + golden_ratio_conjugate) % 1 *360,
      rgb = hsvToRgb(h, 80, 50);
  return "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_and_HSV.
 * Assumes h is contained in the set [0, 360] and
 * s and l are contained in the set [0, 100] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v){
  var chroma = s * v / 10000,
      min = v / 100 - chroma,
      hdash = h / 60,
      x = chroma * (1 - Math.abs(hdash % 2 - 1)),
      r = 0, g = 0, b = 0;

  switch(true){
    case hdash < 1:
      r = chroma;
      g = x;
      break;
    case hdash < 2:
      r = x;
      g = chroma;
      break;
    case hdash < 3:
      g = chroma;
      b = x;
      break;
    case hdash < 4:
      g = x;
      b = chroma;
      break;
    case hdash < 5:
      r = x;
      b = chroma;
      break;
    case hdash <= 6:
      r = chroma;
      b = x;
      break;
  }

  r += min;
  g += min;
  b += min;

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function generateColorList(length) {
  var colors = []
  for (var i = 0; i < length; i++) {
    colors.push(randomColor());
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
  var tableOfContents = document.createElement( 'ul' );
  tableOfContents.id = 'highlights-list';
  tableOfContents.style.listStyleType = "none";
  tableOfContents.style.paddingLeft = "8px";

  for (var i = 0; i < listHighlights.length ; i++) {
    var highlight = listHighlights[i];
    var listElement = document.createElement( 'li' );
    listElement.style.marginBottom = '5px';
    listElement.innerHTML = highlight[3] + " " + highlight[1];
    listElement.onclick = scrollGenerator(highlight[2]);
    listElement.onmouseover = onMouseOver;
    listElement.onmouseleave = onLeave;
    listElement.style.color = colorList[highlight[0]];
    tableOfContents.appendChild(listElement);
  }
  return tableOfContents;
}

function filterFunction() {
  var filterRegex = new RegExp(this.value, "gi");
  var highlightsList = document.getElementById('highlights-list');
  var highlights = highlightsList.childNodes;
  for (var i = 0; i < highlights.length; i++) {
    var highlight = highlights[i];
    if (highlight.innerHTML.match(filterRegex)) {
      highlight.hidden = false;
    } else {
      highlight.hidden = true;
    }
  }
}

function embedDiv(tableOfContents) {
  var currentDiv = document.getElementById("tableOfContentsDiv");
  var oldSearchBarDiv = document.getElementById("loghaus-search-bar");
  if (currentDiv) {
    currentDiv.remove();
  }
  if (oldSearchBarDiv) {
    oldSearchBarDiv.remove();
  }

  var div = document.createElement('div');

  // constants
  searchBarHeight = 26;
  searchBarPadding = 4;

  //append all elements
  document.body.appendChild( div );
  div.appendChild(tableOfContents);
  //set attributes for div
  div.id = 'tableOfContentsDiv';
  div.style.position = 'fixed';
  div.style.top = (searchBarHeight + 2 * searchBarPadding) + 'px';
  div.style.left = '80%';
  div.style.width = '20%';
  div.style.height = '99%';
  div.style.backgroundColor = 'white';
  div.style.opacity = '0.7';
  div.style.overflow = 'scroll';

  var searchBarDiv = document.createElement('div');
  searchBarDiv.id = 'loghaus-search-bar';
  searchBarDiv.style.position = 'fixed';
  searchBarDiv.style.marginTop = searchBarPadding + 'px';
  searchBarDiv.style.top = '0%';
  searchBarDiv.style.height = searchBarHeight + 'px';
  searchBarDiv.style.width = '20%';
  searchBarDiv.style.left = '80%';
  searchBarDiv.style.backgroundColor = 'white';
  searchBarDiv.style.opacity = '0.9';
  searchBarDiv.style.textAlign = 'center';

  var searchBarInput = document.createElement('input');
  searchBarInput.type = 'search';
  searchBarInput.placeholder = 'Filter regex ...';
  searchBarInput.style.width = '98%';
  searchBarInput.style.height = searchBarHeight + 'px';
  searchBarInput.style.borderRadius = '5px';
  // Add keyup search function
  searchBarInput.oninput = filterFunction;

  searchBarDiv.appendChild(searchBarInput);

  document.body.appendChild(searchBarDiv);
}

// This works for log files where the body contains a pre with text
// NOTE: customize this!
function extractTargetElement() {
  return document.body.children[0];
}

// --- Full Generation ---

function fullGeneration() {
  chrome.storage.sync.get({
    timestampRegexString: "",
    rulesJsonString: ""
  }, function(items) {
    var rules = JSON.parse(items.rulesJsonString);
    var regexStrings = [];
    var regexDescriptions = [];
    for (var i = 0; i < rules.length; i++) {
      regexDescriptions.push(rules[i][0]);
      regexStrings.push(rules[i][1]);
    }
    var colorList = generateColorList(regexStrings.length);
    var targetText = extractTargetElement();
    if (items.timestampRegexString.length == 0) {
      // Default timestamp regex
      items.timestampRegexString = "\\d{1,2}:\\d{2}:\\d{2}\\.\\d{0,3}";
    }
    var res = searchAndComputeIndex(targetText.textContent,
      regexStrings,
      regexDescriptions,
      new RegExp(items.timestampRegexString, 'gi')
    );
    var tableOfContents = generateTableOfContents(res, colorList);
    embedDiv(tableOfContents);
  });
}

// Listen for messages
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    // If the received message has the expected format...
    if (msg.text === 'clicked') {
        fullGeneration();
        // Set recompute on resize
        document.body.onresize = fullGeneration
    }
});
