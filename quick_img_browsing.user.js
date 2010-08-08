// ==UserScript==
// @name		Quick Img Browsing
// @namespace	kraml
// @include		*
// @exclude		http*://www.google.com/reader/*
// @exclude		http*://mail.google.com/*
// ==/UserScript==

var DEBUG = true;

// User customizable preferences
var userprefs = {
	// Shortcut keys
	keyUP : 107, // k
	keyDown : 106, // j
	KEY_VIEW_ORIGIN : 118, // v

	// When scroll to next image, the margin between image top edge to window top edge
	margin : 25,

	// Minimal image size. Image with smaller size will be skipped when browsing
	minImgH : 200,
	minImgW : 200,

	// The border color for highlighting current image
	curBorderColor : "#33AF44", //"#7F8F9C",
	// The border color for hightlighting images that has been resized when browsing
	resizedBorderColor : "#FF6666",
	// The border width
	borderWidth : "5px",
};


// Max image size. Image with larger size(either larger height or width) will be resized
MAX_IMG_H = self.innerHeight - 2 * userprefs.margin; // If the image is in a frame, "self" get the size of the frame. If use window.innerHeight will get size of top level window
MAX_IMG_W = self.innerWidth - 2 * userprefs.margin;

// When the size of a image is lager than the max size above, reduce it to below size
var ADEQUATE_IMG_H = MAX_IMG_H - 10;
var ADEQUATE_IMG_W = MAX_IMG_W - 10;

// For display notice / debug messages
var sizeNoticeDIV, naturalSizeSpan, origSizeSpan;
var debugDIV;

var imgList, curImg, lastImg;

var initialized = false;

var $ = function(o){ return document.querySelectorAll(o); }

function init()
{
	if(!initialized) {
		imgList = document.querySelectorAll("img");
		curImg = document.querySelectorAll("img[tabIndex]")[0];

		addGlobalStyle("img[tabIndex=\"0\"] { border-style: solid !important; border-width: " + userprefs.borderWidth +
						" !important; border-color: " + userprefs.curBorderColor + " !important;}");
		addGlobalStyle("img[tabIndex=\"0\"].resized { border-style: solid !important; border-width: " + userprefs.borderWidth +
						" !important; border-color: " + userprefs.resizedBorderColor + " !important;}");

		initialized = true;
	}
}

document.addEventListener('keypress', function(event) {
	init();
	// if(DEBUG) { debugMsg(event.charCode); }
	// if(event.charCode == userprefs.KEY_VIEW_ORIGIN) { document.location.href = curImg.src; }

	if(event.charCode == userprefs.keyDown) { // Browsing from top to bottom
		for(imgIdx = 0; imgIdx < imgList.length; imgIdx++) {
			var img = imgList[imgIdx];

			// Ignore small images. Find the first image that top edege is under current viewport top edge
			if((img.offsetHeight * img.offsetWidth) > (userprefs.minImgH * userprefs.minImgW) &&
				getY(img) > (document.documentElement.scrollTop + userprefs.margin)) {
				lastImg = curImg;
				cleanUpImg(lastImg);

				// Mark current viewing image
				curImg = img;

				// Process image size, add border, event listener etc.
				processImg(curImg);

				if(DEBUG) { debugMsg("Image: " + imgIdx + " / " + imgList.length + 
									"</br>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
									"</br>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
									"</br>Original(HxW): " + curImg.getUserData("origH") + " x " + curImg.getUserData("origW") +
									"</br>Resized(HxW): " + curImg.height + " x " + curImg.width); }

				// Scroll to the proper position
				window.scrollTo(0, getY(curImg) - userprefs.margin);

				// Found the image, exit from the loop, wait for next keypress event
				break;
			}
		}
	} else if (event.charCode == userprefs.keyUP) { // 向上浏览
		for(imgIdx = imgList.length - 1; imgIdx >= 0; imgIdx--) {
			var img = imgList[imgIdx];

			// Ignore small images. In reserved order, find the first image that top edege is just beyond current viewport top edge
			if((img.offsetHeight * img.offsetWidth) > (userprefs.minImgH * userprefs.minImgW) &&
				getY(img) < (document.documentElement.scrollTop + userprefs.margin)) {
				// Remove the tabIndex attribute from former image, always set tabIndex=0 only on current viewing image
				lastImg = curImg;
				cleanUpImg(lastImg);

				// Mark current viewing image
				curImg = img;

				// Process image size, add border, event listener etc.
				processImg(curImg);

				if(DEBUG) { debugMsg("Image: " + imgIdx + " / " + imgList.length + 
									"</br>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
									"</br>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
									"</br>Original(HxW): " + curImg.getUserData("origH") + " x " + curImg.getUserData("origW") +
									"</br>Resized(HxW): " + curImg.height + " x " + curImg.width); }

				// Scroll to the proper position
				window.scrollTo(0, getY(curImg) - userprefs.margin);

				// Found the image, exit from the loop, wait for next keypress event
				break;
			}
		}

	}
}, true);

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
	// Reduce size if image is bigger than the view area
	if(img.height > MAX_IMG_H || img.width > MAX_IMG_W) {
		// Save the oringal H & W first for resize back by the resize buttons
		img.setUserData('origH', img.height, null);
		img.setUserData('origW', img.width, null);

		// Scale according to the Height/Width comparing to the adequate size
		if((img.height / img.width) > (ADEQUATE_IMG_H / ADEQUATE_IMG_W)) {
			img.height = ADEQUATE_IMG_H;
			img.width  = ADEQUATE_IMG_H * img.getUserData("origW") / img.getUserData("origH");
		} else {
			img.width  = ADEQUATE_IMG_W;
			img.height = ADEQUATE_IMG_W * img.getUserData("origH") / img.getUserData("origW");
		}

		img.classList.add("resized");
		displaySizeNoticeMsg(getX(img), getY(img));
		img.addEventListener('mouseover', sizeNoticeMouseOver, false);
		img.addEventListener('mouseout', sizeNoticeMouseOut, false);
	}
	img.setAttribute('tabIndex', 0);

}

function addGlobalStyle(css) {
	var head, style;

	head = document.getElementsByTagName('head')[0];
	if (!head) { return; }

	style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = css;
	head.appendChild(style);
}

function displaySizeNoticeMsg(left, top)
{
	if(!sizeNoticeDIV) {
		// The float message displayed at the top left corner when mouse is over a image
		sizeNoticeDIV = document.createElement('div');
		sizeNoticeDIV.style.cssText = "position: absolute !important;\
								z-index: 9999999999999 !important;\
								float: none !important;\
								font-family: Arial, Helvetica !important;\
								font-size: 12px !important;\
								padding: 2px 2px 2px 2px !important;\
								margin: 0px !important;\
								border: none !important;\
								text-align: left !important;" +
								"background-color: " + userprefs.curBorderColor + " !important;";

		document.body.appendChild(sizeNoticeDIV);
		sizeNoticeDIV.addEventListener('mouseover', sizeNoticeMouseOver, false);
		sizeNoticeDIV.addEventListener('mouseout', sizeNoticeMouseOut, false);

		// The "Origin Size" button in the float message
		origSizeSpan = document.createElement('span');
		origSizeSpan.style.cssText = "cursor: pointer !important;\
										background-color: #F1F1F1 !important;\
										border: none !important;\
										margin: 2px 2px 2px 1px !important;\
										padding: 2px 3px 2px 3px !important;";
		origSizeSpan.innerHTML = "Origin Size";
		origSizeSpan.addEventListener('click', origBtnClick, false);
		sizeNoticeDIV.appendChild(origSizeSpan);

		// The "Natural Size" button in the float message
		naturalSizeSpan = document.createElement('span');
		naturalSizeSpan.style.cssText = "cursor: pointer !important;\
										background-color: #F1F1F1 !important;\
										border: none !important;\
										margin: 2px 1px 2px 2px !important;\
										padding: 2px 3px 2px 3px !important;";
		naturalSizeSpan.innerHTML = "Natual Size";
		naturalSizeSpan.addEventListener('click', naturalBtnClick, false);
		sizeNoticeDIV.appendChild(naturalSizeSpan);
	};

	sizeNoticeDIV.style.setProperty('left', left + "px", 'important');
	sizeNoticeDIV.style.setProperty('top', top + "px", 'important');
	sizeNoticeDIV.style.setProperty('display', 'block', 'important');
}

function sizeNoticeMouseOver()
{
	sizeNoticeDIV.style.setProperty('display', 'block', 'important');
}

function sizeNoticeMouseOut()
{
	sizeNoticeDIV.style.setProperty('display', 'none', 'important');
}

function origBtnClick()
{
	curImg.height = curImg.getUserData("origH");
	curImg.width = curImg.getUserData("origW");
}

function naturalBtnClick()
{
	curImg.height = curImg.naturalHeight;
	curImg.width = curImg.naturalWidth;
}

function cleanUpImg(img)
{
	// Remove the tabIndex attribute, always set tabIndex=0 only on current viewing image
	try	{
		img.removeAttribute("tabIndex");
		img.removeEventListener('mouseover', sizeNoticeMouseOver, false);
		img.removeEventListener('mouseout', sizeNoticeMouseOut, false);
	} catch(err) {
	}
}

function debugMsg(html)
{
	if(!debugDIV) {
		debugDIV = document.createElement('div');
		debugDIV.style.cssText = "position: fixed !important;\
								z-index: 9999999999999 !important;\
								float: none !important;\
								font-family: Arial, Helvetica !important;\
								font-size: 12px !important;\
								padding: 2px 5px 2px 5px !important;\
								background-color: #AF9C90 !important;\
								border: none !important;\
								text-align: left !important;\
								right: 0 !important;\
								bottom: 0 !important;";
		document.body.appendChild(debugDIV);
	};
	debugDIV.innerHTML = html;
}
