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
	curBorderColor : "#7F8F9C",
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
var noticeDIV;
var debugDIV;

var imgList;
var curImg;

var initialized = false;

var $ = function(o){ return document.querySelectorAll(o); }

function init()
{
	if(!initialized) {
		imgList = document.querySelectorAll("img");
		curImg = document.querySelectorAll("img[tabIndex]")[0];
		curImgIdx = 0;

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
				// Remove the tabIndex attribute from former image, always set tabIndex=0 only on current viewing image
				try	{
					curImg.removeAttribute("tabIndex");
				} catch(err) {
				}

				// Process image size
				fitImg(img);

				if(DEBUG) { debugMsg("Image: " + imgIdx + " / " + imgList.length + 
									"</br>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
									"</br>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
									"</br>Original(HxW): " + img.getUserData("origH") + " x " + img.getUserData("origW") +
									"</br>Resized(HxW): " + img.height + " x " + img.width); }

				// Scroll to the proper position
				window.scrollTo(0, getY(img) - userprefs.margin);

				// Mark current viewing image
				curImg = img;
				curImg.setAttribute('tabIndex', 0);

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
				try	{
					curImg.removeAttribute('tabIndex');
				} catch(err) {
				}

				// Process image size
				fitImg(img);

				if(DEBUG) { debugMsg("Image: " + imgIdx + " / " + imgList.length + 
									"</br>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
									"</br>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
									"</br>Original(HxW): " + img.getUserData("origH") + " x " + img.getUserData("origW") +
									"</br>Resized(HxW): " + img.height + " x " + img.width); }

				// Scroll to the proper position
				window.scrollTo(0, getY(img) - userprefs.margin);

				// Mark current viewing image
				curImg = img;
				curImg.setAttribute('tabIndex', 0);

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
function fitImg(img)
{
	img.setUserData('origH', img.height, null);
	img.setUserData('origW', img.width, null);
	//alert(img.getUserData('origH'));

	if(img.height > MAX_IMG_H || img.width > MAX_IMG_W) {
		// 根据长宽比来选择是按高还是宽来缩放
		if((img.height / img.width) > (MAX_IMG_H / MAX_IMG_W)) {
			img.height = ADEQUATE_IMG_H;
			img.width  = ADEQUATE_IMG_H * img.getUserData("origW") / img.getUserData("origH");
		} else {
			img.width  = ADEQUATE_IMG_W;
			img.height = ADEQUATE_IMG_W * img.getUserData("origH") / img.getUserData("origW");
		}
		img.classList.add("resized");
	}
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

function noticeMsg(html)
{
	if(!noticeDIV) {
		noticeDIV = document.createElement('div');
		noticeDIV.style.cssText = '\
			position: fixed !important;\
			z-index: 9999999999999 !important;\
			float: none !important;\
			width: auto !important;\
			height: auto !important;\
			font-family: Segoe UI, Arial, Helvetica !important;\
			font-size: 12px !important;\
			padding: 2px 5px 2px 5px !important;\
			background-color: #33AF44 !important;\
			border: none !important;\
			color: #000 !important;\
			text-align: left !important;\
			right: 0 !important;\
			bottom: 0 !important;\
		';
		document.body.appendChild(noticeDIV);
	};
	noticeDIV.innerHTML=html;
};

function debugMsg(html)
{
	if(!debugDIV) {
		debugDIV = document.createElement('div');
		debugDIV.style.cssText = '\
			position: fixed !important;\
			z-index: 9999999999999 !important;\
			float: none !important;\
			width: auto !important;\
			height: auto !important;\
			font-family: Arial, Helvetica !important;\
			font-size: 12px !important;\
			padding: 2px 5px 2px 5px !important;\
			background-color: #AF9C90 !important;\
			border: none !important;\
			color: #000 !important;\
			text-align: left !important;\
			right: 0 !important;\
			bottom: 0 !important;\
		';
		document.body.appendChild(debugDIV);
	};
	debugDIV.innerHTML = html;
};
