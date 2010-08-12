// ==UserScript==
// @name		Quick Img Browsing
// @description Browse the images in the page easier, with shortcut keys and floating buttons.
// @author		kraml
// @version		2.1.1
// @homepage	http://userscripts.org/scripts/show/83311
// @namespace	http://github.com/kraml/quick_image_browsing
// @include		*
// @exclude		http*://www.google.com/reader/*
// @exclude		http*://mail.google.com/*
// ==/UserScript==

const DEBUG = true;

// User customizable preferences. These are default values. If different values are set by setCfgValue() then these will be overrided
var userprefs = {
	// Two different modes for enumerate all img elements in the page
	// 0: according to current position of images, keyDown jump to the image that is just below top edge
	// 1: totally ignore image position, loop always start from first/last image, by index in the list
	// Mode 1 should work on more sites than mode 0. While mode 0 always start from the current view port so is more intuitive
	mode: 0,

	// Shortcut keys
	keyUp : 107, // k
	keyDown : 106, // j
	keyFill : 102, // f
	keyOrig : 111, // o
	keyNatural : 110, // n
	keyZoomOut : 122, // z
	keyZoomIn : 105, // i
	keyRotate : 114, // r
	keyViewInNewTab : 118, // v
	keySave : 115, // s
	keyCfg : 99, // c

	// When scroll to next image, the margin between image top edge to window top edge
	margin : 30,

	// Minimal image size. Image with smaller size will be skipped when browsing
	minH : 300,
	minW : 300,
	ignoreSmallImg : true,

	// For zoom in and out
	zoomOutStep : 1.25,
	zoomInStep : 0.8,

	// The border color for highlighting current image
	curBorderColor : "#33AF44", //"#7F8F9C",
	// The border color for hightlighting images that has been resized when browsing
	resizedBorderColor : "#FF6666",
	// The border width
	borderWidth : 5,

	// Bring the current viewing image to the most front z-index so when zooming it will keep visible
	// Alert: it will interfere with some other scirpts/extensions as they may also display a floating icon/message on the image,
	// Alert: which may be covered by the image with higher z-index
	bringToFront : true,
	// z-index to set when bring to front
	zIdx: 100,
};

// Max image size. Image with larger size(either larger height or width) will be reduced
var maxH, maxW;

// For display alert / debug messages
var sizeNoticeDIV, fillBtnSpan, naturalBtnSpan, origBtnSpan, zoomOutBtnSpan, zoomInBtnSpan, rotateBtnSpan, viewBtnSpan, saveBtnSpan, cfgBtnSpan;
var alertDIV, debugDIV, cfgBoxDIV;
var alertTimeoutID, debugTimeoutID;

var imgList, curImg, lastImg;

// Used in mode 1
var curIdx = null;

var initialized = false;

function init()
{
	if (!initialized) {
		GM_addStyle(["img[tabIndex='0'] { border-style: solid !important;",
											"border-width: ", getCfgValue("borderWidth"), "px", " !important;", 
											"border-color: ", getCfgValue("curBorderColor"), " !important;}"].join(""));

		GM_addStyle(["img[tabIndex=\"0\"].QIB_resized { border-style: solid !important;", 
													"border-width: ", getCfgValue("borderWidth"), "px", " !important;",
													"border-color: ", getCfgValue("resizedBorderColor"), " !important;}"].join(""));

		GM_addStyle(["div.QIB_sizeNoticeDIV { position: absolute !important;",
										"z-index: 2147483647 !important;",
										"float: none !important;",
										"font-family: Arial, Helvetica !important;",
										"font-size: 9pt !important;",
										"height: auto !important;",
										"width: auto !important;",
										"line-height: 16px !important;",
										"padding: 3px 2px 4px 1px!important; ",
										"margin: 0px !important;",
										"border: 0 none !important;",
										"text-align: left !important;",
										"color: #666666 !important;",
										"background-color: ", getCfgValue("curBorderColor"), " !important;}"].join(""));

		GM_addStyle(["span.QIB_sizeBtnSpan { cursor: pointer !important;",
										"height: auto !important;",
										"width: auto !important;",
										"line-height: 16px !important;",
										"background-color: #F1F1F1 !important;",
										"border: 0 none !important;",
										"margin: 2px 1px 2px 2px !important;",
										"padding: 1px 3px 1px 2px !important;}"].join(""));

		GM_addStyle(["div.QIB_debugDIV { position: fixed !important;",
									"z-index: 2147483647 !important;",
									"float: none !important;",
									"font-family: Arial, Helvetica !important;",
									"font-size: 12px !important;",
									"line-height: 16px !important;",
									"padding: 2px 5px 2px 5px !important;",
									"background-color: #AF9C90 !important;",
									"border: none !important;",
									"text-align: left !important;",
									"color: #303030 !important;",
									"right: 0 !important;",
									"bottom: 0 !important;}"].join(""));

		GM_addStyle(["div.QIB_alertDIV { position: fixed !important;",
									"z-index: 2147483647 !important;",
									"float: none !important;",
									"font-family: Arial, Helvetica !important;",
									"font-size: 16px !important;",
									"padding: 2px 8px 2px 8px !important;",
									"border: none !important;",
									"text-align: left !important;",
									"color: black !important;",
									"left: 0 !important;",
									"bottom: 0 !important;",
									"background-color: ", getCfgValue("curBorderColor"), " !important;}"].join(""));

		GM_addStyle(["div.QIB_cfgBoxDIV { position: fixed !important;",
									"height: auto !important;",
									"width: auto !important;",
									"z-index: 2147483647 !important;",
									"float: none !important;",
									"font-family: Arial, Helvetica !important;",
									"font-size: 12px !important;",
									"line-height: 16px !important;",
									"padding: 3px 5px 0px 5px !important;",
									"background-color: #AF9C90 !important;",
									"border: none !important;",
									"text-align: left !important;",
									"left: 0 !important;",
									"bottom: 0 !important;",
									"color: #303030 !important;}"].join(""));

		GM_addStyle(["#QIB_div { padding: 0px !important;",
									"margin: 2px !important;"].join(""));

		GM_addStyle(["#QIB_div > select, #QIB_div > input, #QIB_div > label {",
									"display: inline !important;",
									"font-family: Arial, Helvetica !important;",
									"font-size: 12px !important;",
									"color: #303030 !important;",
									"padding: 0px !important;",
									"margin: 1px !important;",
									"vertical-align: bottom !important;}"].join(""));

		GM_addStyle(["#QIB_div > select > option { padding-left: 3px !important;}"].join(""));


		initialized = true;
	}
}

document.addEventListener("keypress", function(event) {
	// If currently key pressed in a input, select or textarea, do nothing
	var curElement = document.activeElement.tagName.toLowerCase();
	if (curElement == "input" || curElement == "select" || curElement == "textarea"
		|| document.activeElement.contentEditable == "true" || document.activeElement.contentEditable == "") {
		return;
	}

	if (event.charCode == getCfgValue("keyDown") || event.charCode == getCfgValue("keyUp")) {
		init();

		// Initialize the imgList every time when key pressed so if page changed(like with autopager) we will find the new images.
		imgList = document.querySelectorAll("img");
		curImg = document.querySelectorAll("img[tabIndex]")[0] ? document.querySelectorAll("img[tabIndex]")[0] : imgList[0];
	}

	if (event.charCode == getCfgValue("keyDown")) { // Browsing from top to bottom
		if (getCfgValue("mode") == 1) {
			if (curIdx == null || curIdx < 0) {
				curIdx = 0;
			} else if (curIdx < imgList.length - 1) {
				curIdx++;
			} else {
				curIdx = imgList.length -1;
			}
		}

		var idxStart = (getCfgValue("mode") == 1 ? curIdx : 0);
		for (imgIdx = idxStart; imgIdx < imgList.length; imgIdx++) {
			var img = imgList[imgIdx];

			if (imgIdx == imgList.length - 1) {
				alertMsg("Last Image Reached");

				if (getCfgValue("mode") == 1) {
					// When already at the end of the list, move it back to avoid out of index
					curIdx--;
				}
			}

			if (isValidImg(img, true)) {
				jumpToImg(img, imgIdx);

				// Found the image, exit from the loop, wait for next keypress event
				break;
			}
		}
	} else if (event.charCode == getCfgValue("keyUp")) { // Browsing from buttom to top
		if (getCfgValue("mode") == 1) {
			if (curIdx == null || curIdx > imgList.length - 1) {
				curIdx = imgList.length - 1;
			} else if (curIdx > 0) {
				curIdx--;
			} else {
				curIdx = 0;
			}
		}

		var idxStart = (getCfgValue("mode") == 1 ? curIdx : imgList.length - 1);
		for (imgIdx = idxStart; imgIdx >= 0; imgIdx--) {
			var img = imgList[imgIdx];

			if (imgIdx == 0) {
				alertMsg("First image Reached");

				if (getCfgValue("mode") == 1) {
					// When already at the beginning of the list, move it back to avoid out of index
					curIdx++;
				}
			}

			if (isValidImg(img, false)) {
				jumpToImg(img, imgIdx);

				// Found the image, exit from the loop, wait for next keypress event
				break;
			}
		}
	} else if (event.charCode == getCfgValue("keyFill")) { // Set the size of current image to adequate size
		fillBtnClick();
	} else if (event.charCode == getCfgValue("keyOrig")) { // Set the size of current image to original size
		origBtnClick();
	} else if (event.charCode == getCfgValue("keyNatural")) { // Set the size of current image to natural size
		naturalBtnClick();
	} else if (event.charCode == getCfgValue("keyZoomOut")) { // Zoom out current image
		zoomOutBtnClick();
	} else if (event.charCode == getCfgValue("keyZoomIn")) { // Zoom in current image
		zoomInBtnClick();
	} else if (event.charCode == getCfgValue("keyRotate")) { // Rotate current image
		rotateBtnClick();
	} else if (event.charCode == getCfgValue("keyViewInNewTab")) { // Open image in a new tab
		viewBtnClick();
	} else if (event.charCode == getCfgValue("keySave")) { // Save image
		saveBtnClick();
	} else if (event.charCode == getCfgValue("keyCfg")) { // Show configuration box
		cfgBtnClick();
	}
}, true);

function isValidImg(img, fwd)
{
	// img: The image to check
	// fwd: The direction of the movement. true: forward; false: backward
	var valid;

	// Check size
	valid = getCfgValue("ignoreSmallImg") ? ((img.offsetHeight * img.offsetWidth) > (getCfgValue("minH") * getCfgValue("minW"))) : true;

	// Check position
	if (getCfgValue("mode") == 0) {
		if (fwd) {
			// Jump direction is forward(top to bottom), find the first image that top edege is just below current viewport top edge
			valid = valid && (getY(img) > (window.scrollY + getCfgValue("margin")));
		} else {
			// Jump direction is backward(bottom to top), find the first image that top edege is just above current viewport top edge
			valid = valid && (getY(img) < (window.scrollY + getCfgValue("margin")));
		}
	}

	return valid;
}

function calMaxSize(img)
{
	// Image with larger size(either larger height or width) will be reduced
	// If the image is in a frame, "self" get the size of the frame. If use window.innerHeight will get size of top level window

	// Since the image is always positioned "margin" pixels lower than the top edge, maxH is just window(frame) height minus margin
	maxH = self.innerHeight - getCfgValue("margin") - 15;
	// maxW is a bit complexer, as image is not horizontally positioned "margin" pixels right to the left edge, may from center of a page
	// innerWidth include the scrollbar width so it is actually a bit larger than the page area
	maxW = window.scrollX + self.innerWidth - getX(img) - getCfgValue("margin") - 15;
}

function resizeImg(img)
{
		// Scale according to the H/W ratio comparing to the max size ratio
		if ((img.height / img.width) > (maxH / maxW)) {
			img.height = maxH;
			img.width  = maxH * img.getUserData("origW") / img.getUserData("origH");
		} else {
			img.width  = maxW;
			img.height = maxW * img.getUserData("origH") / img.getUserData("origW");
		}

		img.classList.add("QIB_resized");
}

function processImg(img)
{
	// Save the oringal H & W first for resize back by the resize buttons
	if (img.getUserData("origH") == null) { img.setUserData("origH", img.height, null); }
	if (img.getUserData("origW") == null) { img.setUserData("origW", img.width, null); }

	calMaxSize(img);
	// Reduce size if image is bigger than the view area
	if (img.height > maxH || img.width > maxW) {
		resizeImg(img);
	}

	// Set tabIndex=0 always for current viewing image
	img.setAttribute("tabIndex", 0);

	// Bring the image to front
	if (getCfgValue("bringToFront")) {
		img.style.setProperty("position", "relative", "important");
		img.style.setProperty("z-index", getCfgValue("zIdx"), "important");
	}

	// Add event listener for mouse over and out event
	img.addEventListener("mouseover", sizeNoticeMouseOver, false);
	img.addEventListener("mouseout", sizeNoticeMouseOut, false);

	// Setup the size buttons but do not display them untill mouse over
	displaySizeNotice(false, getX(img), getY(img));
}

function jumpToImg(img, imgIdx)
{
	// Mark current and last image
	lastImg = curImg;
	curImg = img;
	curIdx = imgIdx;

	cleanUpImg(lastImg);

	// Handle image size, add border, event listener etc.
	processImg(curImg);

	// Scroll to the proper position
	window.scrollTo(0, getY(curImg) - getCfgValue("margin"));

	debugMsg();
}

function cleanUpImg(img)
{
	// This function should only take the last img as an argument
	// Remove the tabIndex attribute, always set tabIndex=0 only on current viewing image
	try	{
		img.removeAttribute("tabIndex");
		img.removeEventListener("mouseover", sizeNoticeMouseOver, false);
		img.removeEventListener("mouseout", sizeNoticeMouseOut, false);
	} catch(err) {
	}
}

function displaySizeNotice(display, left, top)
{
	if (!sizeNoticeDIV) {
		// The float message displayed at the top left corner when mouse is over a image
		sizeNoticeDIV = document.createElement("div");
		sizeNoticeDIV.className = "QIB_sizeNoticeDIV";
		window.top.document.body.appendChild(sizeNoticeDIV);
		sizeNoticeDIV.addEventListener("mouseover", sizeNoticeMouseOver, false);
		sizeNoticeDIV.addEventListener("mouseout", sizeNoticeMouseOut, false);

		// The "Fill Size" button in the float message
		fillBtnSpan		= createBtn("<u>F</u>ill", fillBtnClick); // Fill image to adequate
		origBtnSpan		= createBtn("<u>O</u>rig", origBtnClick); // Scale to original size appointed in web page
		naturalBtnSpan	= createBtn("<u>N</u>atual", naturalBtnClick); // Scale to its natural size
		zoomOutBtnSpan	= createBtn("<u>Z</u> Out", zoomOutBtnClick); // Zoom out by zoomOutStep
		zoomInBtnSpan	= createBtn("Z <u>I</u>n", zoomInBtnClick); // Zoom n by zoomInStep
		rotateBtnSpan	= createBtn("<u>R</u>otate", rotateBtnClick); // Rotate 90 degrees clockwise
		viewBtnSpan		= createBtn("<u>V</u>iew", viewBtnClick); // View image in a new tab
		//saveBtnSpan		= createBtn("<u>S</u>ave", saveBtnClick); // Save image as
		cfgBtnSpan		= createBtn("<u>C</u>fg", cfgBtnClick); // Config options
	};

	sizeNoticeDIV.style.setProperty("left", left + "px", "important");
	sizeNoticeDIV.style.setProperty("top", top + "px", "important");
	sizeNoticeDIV.style.setProperty("display", (display ? "block" : "none"), "important");
}

function sizeNoticeMouseOver()
{
	sizeNoticeDIV.style.setProperty("display", "inline", "important");
}

function sizeNoticeMouseOut()
{
	sizeNoticeDIV.style.setProperty("display", "none", "important");
}

function createBtn(html, func)
{
	// html: button label
	// func: the function to call when clicked
	var btn = document.createElement("span");
	btn.className = "QIB_sizeBtnSpan";
	btn.innerHTML = html;
	btn.addEventListener("click", func, false);
	sizeNoticeDIV.appendChild(btn);

	return btn;
}

function fillBtnClick()
{
	calMaxSize(curImg);
	resizeImg(curImg)
	displaySizeNotice(true, getX(curImg), getY(curImg));
	debugMsg();
}

function origBtnClick()
{
	if (curImg.getUserData("origH") != null && curImg.getUserData("origW") != null) {
		curImg.height = curImg.getUserData("origH");
		curImg.width = curImg.getUserData("origW");

		curImg.classList.remove("QIB_resized");

		displaySizeNotice(true, getX(curImg), getY(curImg));
		debugMsg();
	}
}

function naturalBtnClick()
{
	curImg.height = curImg.naturalHeight;
	curImg.width = curImg.naturalWidth;

	displaySizeNotice(true, getX(curImg), getY(curImg));
	debugMsg();
}

function zoomOutBtnClick()
{
	// Some site use javascript to ensure proportional scaling of the image. So need to save the current H/W first before change any of them
	// If the code is like this:
	// curImg.height *= getCfgValue("zoomOutStep");
	// curImg.width  *= getCfgValue("zoomOutStep");
	// Then when height is changed first the width actually is increased accordingly, and then get increased again, thus give a non-proportional scaled image

	var curH = curImg.height;
	var curW = curImg.width;
	curImg.height = curH * getCfgValue("zoomOutStep");
	curImg.width  = curW * getCfgValue("zoomOutStep");

	displaySizeNotice(true, getX(curImg), getY(curImg));
	debugMsg();
}

function zoomInBtnClick()
{
	// See zoom out code above
	var curH = curImg.height;
	var curW = curImg.width;
	curImg.height = curH * getCfgValue("zoomInStep");
	curImg.width  = curW * getCfgValue("zoomInStep");

	displaySizeNotice(true, getX(curImg), getY(curImg));
	debugMsg();
}

function rotateBtnClick()
{
	// Rotate 90 degrees clockwise each time
	if (curImg.style.getPropertyValue("-moz-transform") == "rotate(90deg)") {
		curImg.style.setProperty("-moz-transform", "rotate(180deg)", "important");
	} else if (curImg.style.getPropertyValue("-moz-transform") == "rotate(180deg)") {
		curImg.style.setProperty("-moz-transform", "rotate(270deg)", "important");
	} else if (curImg.style.getPropertyValue("-moz-transform") == "rotate(270deg)") {
		curImg.style.removeProperty("-moz-transform");
	} else {
		curImg.style.setProperty("-moz-transform", "rotate(90deg)", "important");
	}

	displaySizeNotice(true, getX(curImg), getY(curImg));
	debugMsg();
}

function viewBtnClick()
{
	GM_openInTab(curImg.src);
}

function saveBtnClick()
{
	// TODO: save image function
}

function cfgBtnClick()
{
	displayCfgBox(true);
}

function debugMsg(html)
{
	if (DEBUG) {
		if (!debugDIV) {
			debugDIV = document.createElement("div");
			debugDIV.className = "QIB_debugDIV";
			document.body.appendChild(debugDIV);
		};
		debugDIV.innerHTML = "Image Idx: " + curIdx + " / " + imgList.length +
			"<br/>Current(H/W): " + curImg.height + " / " + curImg.width + " (" + (curImg.height / curImg.width).toFixed(3) + ")" +
			"<br/>Original(H/W): " + curImg.getUserData("origH") + " / " + curImg.getUserData("origW")  + " (" + (curImg.getUserData("origH") / curImg.getUserData("origW")).toFixed(3) + ")" +
			"<br/>Max(H/W): " + maxH + " / " + maxW + " (" + (maxH / maxW).toFixed(3) + ")";
		debugDIV.style.setProperty("display", "inline", "important");

		/*if (typeof debugTimeoutID == "number") {
			window.clearTimeout(debugTimeoutID);
		}
		debugTimeoutID = window.setTimeout(function() {
			debugDIV.style.setProperty("display", "none", "important");
		}, 5000);*/
	}
}

function alertMsg(html)
{
	if (!alertDIV) {
		alertDIV = document.createElement("div");
		alertDIV.className = "QIB_alertDIV";
		document.body.appendChild(alertDIV);
	};
	alertDIV.innerHTML = html;
	alertDIV.style.setProperty("display", "inline", "important");

	if (typeof alertTimeoutID == "number") {
		window.clearTimeout(alertTimeoutID);
	}
	alertTimeoutID = window.setTimeout(function() {
		alertDIV.style.setProperty("display", "none", "important");
	}, 2000);
}

function displayCfgBox(display)
{
	if (!cfgBoxDIV) {
		cfgBoxDIV = document.createElement("div");
		cfgBoxDIV.className = "QIB_cfgBoxDIV";
		document.body.appendChild(cfgBoxDIV);

	};

	cfgBoxDIV.style.setProperty("display", (display ? "block" : "none"), "important");

	cfgBoxDIV.innerHTML = [
		"<div id='QIB_div'>",
			"Mode: ",
			"<select id='QIB_mode' title='Choose different mode for enumerate and loop image. Mode 1 should work on more sites than mode 0. While mode 0 always start from the current view port so is more intuitive'>",
				(getCfgValue("mode") == 1 ? 
					"<option value='0'>0 - By img position</option>" + 
					"<option value='1' selected>1 - By img index</option>"
				:
					"<option value='0' selected>0 - By img position</option>" + 
					"<option value='1'>1 - By img index</option>"
				),
			"</select>",
		"</div>",
		"<div id='QIB_div'>",
			"Top margin: <input type='text' id='QIB_margin' maxlength='4' size='3' title='Top margin when jump to a image' value='", getCfgValue("margin"), "'/>",
		"</div>",
		"<div id='QIB_div'>",
			"<input type='checkbox' id='QIB_ignore_small' title='Check to ignore small images when navigating' ", (getCfgValue("ignoreSmallImg") ? "checked" : ""), "/>&nbsp;",
			"<label for='QIB_ignore_small'>Ignore images smaller than</label><br/>",
			"Height: <input type='text' id='QIB_min_h' maxlength='4' size='3' title='Height to ignore' value='", getCfgValue("minH"), "'/>",
			" Width: <input type='text' id='QIB_min_w' maxlength='4' size='3' title='Width to ignore'  value='", getCfgValue("minW"), "'/>",
		"</div>",
		"<div id='QIB_div'>",
			"<input type='button' id='QIB_save_config' value='Save' title='Save the configuration'/>&nbsp;&nbsp;",
			"<input type='button' id='QIB_reset_config' value='Reset' title='Reset these options to default'/>&nbsp;&nbsp;",
			"<input type='button' id='QIB_cancel_config' value='Cancel' title='Cancel and don't save configuration'/>",
		"</div>",
		].join("");

	document.getElementById("QIB_save_config").addEventListener("click", saveCfg, false);
	document.getElementById("QIB_reset_config").addEventListener("click", resetCfg, false);
	document.getElementById("QIB_cancel_config").addEventListener("click", cancelCfg, false);

	/*if (typeof debugTimeoutID == "number") {
		window.clearTimeout(debugTimeoutID);
	}
	debugTimeoutID = window.setTimeout(function() {
		cfgBoxDIV.style.setProperty("display", "none", "important");
	}, 5000);*/
}

function saveCfg()
{
	setCfgValue("mode", document.getElementById("QIB_mode").value - 0); // Trick to convert string to number
	setCfgValue("margin", document.getElementById("QIB_margin").value - 0);
	setCfgValue("ignoreSmallImg", Boolean(document.getElementById("QIB_ignore_small").checked));
	setCfgValue("minH", document.getElementById("QIB_min_h").value - 0);
	setCfgValue("minW", document.getElementById("QIB_min_w").value - 0);

	displayCfgBox(false);
}

function resetCfg()
{
	GM_deleteValue("mode");
	GM_deleteValue("margin");
	GM_deleteValue("ignoreSmallImg");
	GM_deleteValue("minH");
	GM_deleteValue("minW");

	displayCfgBox(false);
}

function cancelCfg()
{
	displayCfgBox(false);
}

// Get the distance between left edge of the page to left edge of the object
function getX(obj)
{
	return obj.offsetLeft + (obj.offsetParent ? getX(obj.offsetParent) : obj.x ? obj.x : 0);
}

// Get the distance between top edge of the page to top edge of the object
function getY(obj)
{
	return (obj.offsetParent ? obj.offsetTop + getY(obj.offsetParent) : obj.y ? obj.y : 0);
}

function getCfgValue(key)
{
	// If there is customized value, return it. If there is not, return the predefined default value from userprefs
	//var value = window.localStorage ? window.localStorage.getItem(name) : getCookie(name);
	//return (value ? decodeURIComponent(value) : '');
	return GM_getValue(key, userprefs[key]);
}

function setCfgValue(key, value)
{
	//value = encodeURIComponent(value);
	//window.localStorage ? window.localStorage.setItem(setName, value) : setCookie(setName, value, 365, '/', location.hostname);
	GM_setValue(key, value);
}


// Thanks Jarett for the Script Update Checker script: // http://userscripts.org/scripts/show/20145
var SUC_script_num = 83311; // Change this to the number given to the script by userscripts.org (check the address bar)
try{function updateCheck(forced){if ((forced) || (parseInt(GM_getValue('SUC_last_update', '0')) + (24 * 60 * 60 * 1000) <= (new Date().getTime()))){try{GM_xmlhttpRequest({method: 'GET',url: 'http://userscripts.org/scripts/source/'+SUC_script_num+'.meta.js?'+new Date().getTime(),headers: {'Cache-Control': 'no-cache'},onload: function(resp){var local_version, remote_version, rt, script_name;rt=resp.responseText;GM_setValue('SUC_last_update', new Date().getTime()+'');remote_version=parseInt(/@uso:version\s*(.*?)\s*$/m.exec(rt)[1]);local_version=parseInt(GM_getValue('SUC_current_version', '-1'));if(local_version!=-1){script_name = (/@name\s*(.*?)\s*$/m.exec(rt))[1];GM_setValue('SUC_target_script_name', script_name);if (remote_version > local_version){if(confirm('There is an update available for the Greasemonkey script "'+script_name+'."\nWould you like to go to the install page now?')){GM_openInTab('http://userscripts.org/scripts/show/'+SUC_script_num);GM_setValue('SUC_current_version', remote_version);}}else if (forced)alert('No update is available for "'+script_name+'."');}else GM_setValue('SUC_current_version', remote_version+'');}});}catch (err){if (forced)alert('An error occurred while checking for updates:\n'+err);}}}GM_registerMenuCommand(GM_getValue('SUC_target_script_name', 'Quick Image Browsing') + ' - Manual Update Check', function(){updateCheck(true);});updateCheck(false);}catch(err){}
