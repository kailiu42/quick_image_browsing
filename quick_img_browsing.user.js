// ==UserScript==
// @name		Quick Img Browsing
// @description Browse the images in the page easier, with shortcut keys and floating buttons.
// @author		kraml
// @version		1.2.1
// @homepage	http://userscripts.org/scripts/show/83311
// @namespace	http://github.com/kraml/quick_image_browsing
// @include		*
// @exclude		http*://www.google.com/reader/*
// @exclude		http*://mail.google.com/*
// ==/UserScript==

const DEBUG = true;

// User customizable preferences
var userprefs = {
	// Shortcut keys
	keyUP : 107, // k
	keyDown : 106, // j
	keyFill : 102, // f
	keyOrig : 111, // o
	keyNatural : 110, // n
	keyZoomOut : 122, // z
	keyZoomIn : 105, // i
	keyRotate : 114, // r
	keyViewInNewTab : 118, // v
	keySave : 115, // s

	// When scroll to next image, the margin between image top edge to window top edge
	margin : 25,

	// Minimal image size. Image with smaller size will be skipped when browsing
	minImgH : 300,
	minImgW : 300,

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

// Max image size. Image with larger size(either larger height or width) will be resized
var MAX_IMG_H, MAX_IMG_W;

// When the size of a image is lager than the max size above, reduce it to below size
var ADEQUATE_IMG_H, ADEQUATE_IMG_W;

// For display alert / debug messages
var sizeNoticeDIV, fillBtnSpan, naturalBtnSpan, origBtnSpan, zoomOutBtnSpan, zoomInBtnSpan, rotateBtnSpan, viewBtnSpan, saveBtnSpan;
var alertDIV, debugDIV;
var alertTimeoutID, debugTimeoutID;

var imgList, curImg, lastImg;

var initialized = false;

function init()
{
	if (!initialized) {
		GM_addStyle(["img[tabIndex='0'] { border-style: solid !important; ",
											"border-width: ", userprefs.borderWidth, "px", " !important; ", 
											"border-color: ", userprefs.curBorderColor, " !important; }"].join(""));

		GM_addStyle(["img[tabIndex=\"0\"].resized { border-style: solid !important; ", 
													"border-width: ", userprefs.borderWidth, "px", " !important; ",
													"border-color: ", userprefs.resizedBorderColor, " !important; }"].join(""));

		GM_addStyle(["div.sizeNoticeDIV { position: absolute !important; ",
										"z-index: 2147483647 !important; ",
										"float: none !important; ",
										"font-family: Arial, Helvetica !important; ",
										"font-size: 9pt !important; ",
										"height: auto !important; ",
										"width: auto !important; ",
										"line-height: 16px !important; ",
										"padding: 3px 2px 4px 1px!important; ",
										"margin: 0px !important; ",
										"border: 0 none !important; ",
										"text-align: left !important; ",
										"color: #666666 !important;",
										"background-color: ", userprefs.curBorderColor, " !important; }"].join(""));

		GM_addStyle(["span.sizeBtnSpan { cursor: pointer !important; ",
										"height: auto !important; ",
										"width: auto !important; ",
										"line-height: 16px !important; ",
										"background-color: #F1F1F1 !important; ",
										"border: 0 none !important; ",
										"margin: 2px 1px 2px 2px !important; ",
										"padding: 1px 3px 1px 2px !important; }"].join(""));

		GM_addStyle(["div.debugDIV { position: fixed !important; ",
									"z-index: 2147483647 !important; ",
									"float: none !important; ",
									"font-family: Arial, Helvetica !important; ",
									"font-size: 12px !important; ",
									"line-height: 16px !important; ",
									"padding: 2px 5px 2px 5px !important; ",
									"background-color: #AF9C90 !important; ",
									"border: none !important; ",
									"text-align: left !important; ",
									"color: #303030 !important; ",
									"right: 0 !important; ",
									"bottom: 0 !important; }"].join(""));

		GM_addStyle(["div.alertDIV { position: fixed !important; ",
									"z-index: 2147483647 !important; ",
									"float: none !important; ",
									"font-family: Arial, Helvetica !important; ",
									"font-size: 16px !important; ",
									"padding: 2px 8px 2px 8px !important; ",
									"border: none !important; ",
									"text-align: left !important; ",
									"color: black !important; ",
									"left: 0 !important; ",
									"bottom: 0 !important;",
									"background-color: ", userprefs.curBorderColor, " !important; }"].join(""));

		initialized = true;
	}
}

// When the window loaded or resized, calculate the max and adequate size
window.addEventListener("load", calSize, true);
window.addEventListener("resize", calSize, true);

document.addEventListener("keypress", function(event) {
	// If currently key pressed in a input, select or textarea, do nothing
	var curElement = document.activeElement.tagName.toLowerCase();
	if (curElement == "input" || curElement == "select" || curElement == "textarea") {
		return;
	}

	if (event.charCode == userprefs.keyDown || event.charCode == userprefs.keyUp) {
		init();

		// Initialize the imgList every time when key pressed so if page changed(like with autopager) we will find the new images.
		imgList = document.querySelectorAll("img");
		curImg = document.querySelectorAll("img[tabIndex]")[0];
	}

	if (event.charCode == userprefs.keyDown) { // Browsing from top to bottom
		for(imgIdx = 0; imgIdx < imgList.length; imgIdx++) {
			var img = imgList[imgIdx];

			// Ignore small images. Find the first image that top edege is under current viewport top edge
			if ((img.offsetHeight * img.offsetWidth) > (userprefs.minImgH * userprefs.minImgW) &&
				getY(img) > (window.scrollY + userprefs.margin)) {

				lastImg = curImg;
				cleanUpImg(lastImg);

				// Mark current viewing image
				curImg = img;

				// Process image size, add border, event listener etc.
				processImg(curImg);

				debugMsg("Image: " + imgIdx + " / " + imgList.length +
						"<br/>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
						"<br/>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
						"<br/>Original(HxW): " + curImg.getUserData("origH") + " x " + curImg.getUserData("origW") +
						"<br/>Resized(HxW): " + curImg.height + " x " + curImg.width);

				// Scroll to the proper position
				window.scrollTo(0, getY(curImg) - userprefs.margin);

				// Found the image, exit from the loop, wait for next keypress event
				break;
			}
			if (imgIdx == imgList.length - 1) {
				alertMsg("Already last image!");
			}
		}
	} else if (event.charCode == userprefs.keyUP) { // Browsing from buttom to top
		for(imgIdx = imgList.length - 1; imgIdx >= 0; imgIdx--) {
			var img = imgList[imgIdx];

			// Ignore small images. In reserved order, find the first image that top edege is just beyond current viewport top edge
			if ((img.offsetHeight * img.offsetWidth) > (userprefs.minImgH * userprefs.minImgW) &&
				getY(img) < (window.scrollY + userprefs.margin)) {
				// Remove the tabIndex attribute from former image, always set tabIndex=0 only on current viewing image
				lastImg = curImg;
				cleanUpImg(lastImg);

				// Mark current viewing image
				curImg = img;

				// Process image size, add border, event listener etc.
				processImg(curImg);

				debugMsg("Image: " + imgIdx + " / " + imgList.length +
						"<br/>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
						"<br/>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
						"<br/>Original(HxW): " + curImg.getUserData("origH") + " x " + curImg.getUserData("origW") +
						"<br/>Resized(HxW): " + curImg.height + " x " + curImg.width);

				// Scroll to the proper position
				window.scrollTo(0, getY(curImg) - userprefs.margin);

				// Found the image, exit from the loop, wait for next keypress event
				break;
			}
			if (imgIdx == 0) {
				alertMsg("Already first image!");
			}
		}
	} else if (event.charCode == userprefs.keyFill) { // Set the size of current image to adequate size
		fillBtnClick();
	} else if (event.charCode == userprefs.keyOrig) { // Set the size of current image to original size
		origBtnClick();
	} else if (event.charCode == userprefs.keyNatural) { // Set the size of current image to natural size
		naturalBtnClick();
	} else if (event.charCode == userprefs.keyZoomOut) { // Zoom out current image
		zoomOutBtnClick();
	} else if (event.charCode == userprefs.keyZoomIn) { // Zoom in current image
		zoomInBtnClick();
	} else if (event.charCode == userprefs.keyRotate) { // Rotate current image
		rotateBtnClick();
	} else if (event.charCode == userprefs.keyViewInNewTab) { // Open image in a new tab
		viewBtnClick();
	} else if (event.charCode == userprefs.keySave) { // Save image
		saveBtnClick();
	}
}, true);

function calSize()
{
	// Max image size. Image with larger size(either larger height or width) will be resized
	MAX_IMG_H = self.innerHeight - 2 * userprefs.margin; // If the image is in a frame, "self" get the size of the frame. If use window.innerHeight will get size of top level window
	MAX_IMG_W = self.innerWidth - 2 * userprefs.margin;

	// When the size of a image is lager than the max size above, reduce it to below size
	ADEQUATE_IMG_H = MAX_IMG_H - 10;
	ADEQUATE_IMG_W = MAX_IMG_W - 10;
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

// Reduce image size
function processImg(img)
{
	// Save the oringal H & W first for resize back by the resize buttons
	if (img.getUserData("origH") == null) { img.setUserData("origH", img.height, null); }
	if (img.getUserData("origW") == null) { img.setUserData("origW", img.width, null); }

	// Reduce size if image is bigger than the view area
	if (img.height > MAX_IMG_H || img.width > MAX_IMG_W) {
		// Scale down according to the Height/Width comparing to the adequate size
		if ((img.height / img.width) > (ADEQUATE_IMG_H / ADEQUATE_IMG_W)) {
			img.height = ADEQUATE_IMG_H;
			img.width  = ADEQUATE_IMG_H * img.getUserData("origW") / img.getUserData("origH");
		} else {
			img.width  = ADEQUATE_IMG_W;
			img.height = ADEQUATE_IMG_W * img.getUserData("origH") / img.getUserData("origW");
		}

		img.classList.add("resized");
	}

	// Set tabIndex=0 always for current viewing image
	img.setAttribute("tabIndex", 0);

	// Bring the image to front
	if (userprefs.bringToFront) {
		img.style.setProperty("position", "relative", "important");
		img.style.setProperty("z-index", userprefs.zIdx, "important");
	}

	// Add event listener for mouse over and out event
	img.addEventListener("mouseover", sizeNoticeMouseOver, false);
	img.addEventListener("mouseout", sizeNoticeMouseOut, false);

	// Setup the size buttons but do not display them untill mouse over
	displaySizeNotice(false, getX(img), getY(img));
}

function cleanUpImg(img)
{
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
		sizeNoticeDIV.className = "sizeNoticeDIV";
		document.body.appendChild(sizeNoticeDIV);
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
		// saveBtnSpan		= createBtn("<u>S</u>ave", saveBtnClick); // Save image as
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
	btn.className = "sizeBtnSpan";
	btn.innerHTML = html;
	btn.addEventListener("click", func, false);
	sizeNoticeDIV.appendChild(btn);

	return btn;
}

function fillBtnClick()
{
	// Scale according to the H/W ratio comparing to the adequate size
	if ((curImg.height / curImg.width) > (ADEQUATE_IMG_H / ADEQUATE_IMG_W)) {
		curImg.height = ADEQUATE_IMG_H;
		curImg.width  = ADEQUATE_IMG_H * curImg.getUserData("origW") / curImg.getUserData("origH");
	} else {
		curImg.width  = ADEQUATE_IMG_W;
		curImg.height = ADEQUATE_IMG_W * curImg.getUserData("origH") / curImg.getUserData("origW");
	}
	displaySizeNotice(true, getX(curImg), getY(curImg));
}

function origBtnClick()
{
	if (curImg.getUserData("origH") != null && curImg.getUserData("origW") != null) {
		curImg.height = curImg.getUserData("origH");
		curImg.width = curImg.getUserData("origW");

		displaySizeNotice(true, getX(curImg), getY(curImg));
	}
}

function naturalBtnClick()
{
	curImg.height = curImg.naturalHeight;
	curImg.width = curImg.naturalWidth;

	displaySizeNotice(true, getX(curImg), getY(curImg));
}

function zoomOutBtnClick()
{
	// Some site use javascript to ensure proportional scaling of the image. So need to save the current H/W first before change any of them
	// If the code is like this:
	// curImg.height *= userprefs.zoomOutStep;
	// curImg.width  *= userprefs.zoomOutStep;
	// Then when height is changed first the width actually is increased accordingly, and then get increased again, thus give a non-proportional scaled image

	var curH = curImg.height;
	var curW = curImg.width;
	curImg.height = curH * userprefs.zoomOutStep;
	curImg.width  = curW * userprefs.zoomOutStep;

	displaySizeNotice(true, getX(curImg), getY(curImg));
}

function zoomInBtnClick()
{
	// See zoom out code above
	var curH = curImg.height;
	var curW = curImg.width;
	curImg.height = curH * userprefs.zoomInStep;
	curImg.width  = curW * userprefs.zoomInStep;

	displaySizeNotice(true, getX(curImg), getY(curImg));
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
}

function viewBtnClick()
{
	GM_openInTab(curImg.src);
}

function saveBtnClick()
{
	// TODO: save image function
}

function debugMsg(html)
{
	if (DEBUG) {
		if (!debugDIV) {
			debugDIV = document.createElement("div");
			debugDIV.className = "debugDIV";
			document.body.appendChild(debugDIV);
		};
		debugDIV.innerHTML = html;
		debugDIV.style.setProperty("display", "inline", "important");

		if (typeof debugTimeoutID == "number") {
			window.clearTimeout(debugTimeoutID);
		}
		debugTimeoutID = window.setTimeout(function() {
			debugDIV.style.setProperty("display", "none", "important");
		}, 5000);
	}
}

function alertMsg(html)
{
	if (!alertDIV) {
		alertDIV = document.createElement("div");
		alertDIV.className = "alertDIV";
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

// Thanks Jarett for the Script Update Checker script: // http://userscripts.org/scripts/show/20145
var SUC_script_num = 83311; // Change this to the number given to the script by userscripts.org (check the address bar)
try{function updateCheck(forced){if ((forced) || (parseInt(GM_getValue('SUC_last_update', '0')) + (24 * 60 * 60 * 1000) <= (new Date().getTime()))){try{GM_xmlhttpRequest({method: 'GET',url: 'http://userscripts.org/scripts/source/'+SUC_script_num+'.meta.js?'+new Date().getTime(),headers: {'Cache-Control': 'no-cache'},onload: function(resp){var local_version, remote_version, rt, script_name;rt=resp.responseText;GM_setValue('SUC_last_update', new Date().getTime()+'');remote_version=parseInt(/@uso:version\s*(.*?)\s*$/m.exec(rt)[1]);local_version=parseInt(GM_getValue('SUC_current_version', '-1'));if(local_version!=-1){script_name = (/@name\s*(.*?)\s*$/m.exec(rt))[1];GM_setValue('SUC_target_script_name', script_name);if (remote_version > local_version){if(confirm('There is an update available for the Greasemonkey script "'+script_name+'."\nWould you like to go to the install page now?')){GM_openInTab('http://userscripts.org/scripts/show/'+SUC_script_num);GM_setValue('SUC_current_version', remote_version);}}else if (forced)alert('No update is available for "'+script_name+'."');}else GM_setValue('SUC_current_version', remote_version+'');}});}catch (err){if (forced)alert('An error occurred while checking for updates:\n'+err);}}}GM_registerMenuCommand(GM_getValue('SUC_target_script_name', 'Quick Image Browsing') + ' - Manual Update Check', function(){updateCheck(true);});updateCheck(false);}catch(err){}
