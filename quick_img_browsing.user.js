// ==UserScript==
// @name		Quick Img Browsing
// @namespace	kraml
// @include		*
// @exclude		http*://www.google.com/reader/*
// @exclude		http*://mail.google.com/*
// ==/UserScript==

var DEBUG = true;

var userprefs = {
	// 快捷键
	keyUP : 107, // k
	keyDown : 106, // j
	KEY_VIEW_ORIGIN : 118, // v

	//滚动页面到图片时，图片边缘的与可视区域的边距
	margin : 20,

	// 最小图片尺寸。小于此大小的图片将会在浏览时跳过
	minImgH : 200,
	minImgW : 200,
};


// 最大图片尺寸。大于（任一维度大于最大值时）此大小的图片将会被缩小
MAX_IMG_H = self.innerHeight - 2 * userprefs.margin; // 如果图片页面在一个frame内，self取得的是frame的尺寸。如果使用window.innerWidth取得的是顶层窗口的尺寸
MAX_IMG_W = self.innerWidth - 2 * userprefs.margin;

// 图片尺寸大于上面的最大尺寸时，将会被缩小到不超过如下尺寸
var ADEQUATE_IMG_H = MAX_IMG_H - 10;
var ADEQUATE_IMG_W = MAX_IMG_W - 10;

var eve;
var noticeDIV;
var debugDIV;

var imgList;
var curImg;
var curimgIdx;
var nextImgIdx; // 指的要滚动到的下一张的图片的Idx，不是在list里面按顺序的下一张

var initialized = false;

var $ = function(o){ return document.querySelectorAll(o); }

function init()
{
	if(!initialized) {
		imgList = document.querySelectorAll("img");
		curImg = document.querySelectorAll("img[tabIndex]")[0];
		curImgIdx = 0;

		addGlobalStyle('img[tabIndex=\"0\"] { border-style: solid !important; border-width: 6px !important; border-color: #7f8f9c !important;}');

		initialized = true;
	}
}

document.addEventListener('keypress', function(event) {
	init();
	// if(DEBUG) { debugMsg(event.charCode); }
	// if(event.charCode == userprefs.KEY_VIEW_ORIGIN) { document.location.href = curImg.src; }

	if(event.charCode == userprefs.keyDown) { // 向下浏览
		for(imgIdx = 0; imgIdx < imgList.length; imgIdx++) {
			var img = imgList[imgIdx];

			// 忽略很小的图片
			if((img.offsetWidth * img.offsetHeight) > (userprefs.minImgW * userprefs.minImgH)) {
				// 当前位置图片
				// alert("getY: " + getY(img) + "\ndocument.documentElement.scrollTop: " + document.documentElement.scrollTop);

				// 寻找第一个正在当前可视区域的图片，从它开始浏览，而不是从第一个
				if(getY(img) > document.documentElement.scrollTop + userprefs.margin) {
					// 将之前浏览的那张图片的tabIndex属性清空
					try	{
						curImg.removeAttribute('tabindex');
					}
					catch(err) {
					}

					nextImgIdx = imgIdx;

					// 缩小图片以适应屏幕
					fitImg(imgList[nextImgIdx]);

					if(DEBUG) { debugMsg("Current: " + imgIdx + "</br>Scroll To: " + nextImgIdx + "</br>Total:" + imgList.length + 
										"</br>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
										"</br>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
										"</br>Original(HxW): " + imgList[nextImgIdx].getUserData("origH") + " x " + imgList[nextImgIdx].getUserData("origW") +
										"</br>Resized(HxW): " + imgList[nextImgIdx].height + " x " + imgList[nextImgIdx].width); }

					//滚动到图片
					window.scrollTo(0, getY(imgList[nextImgIdx]) - userprefs.margin);

					//标识当前图片
					curImg = imgList[nextImgIdx];
					imgList[nextImgIdx].setAttribute('tabIndex', 0);
					curImgIdx = nextImgIdx;

					// 寻找到图片并完成滚动，退出循环，等待下个keypress event
					break;
				}
			}
		}
	} else if (event.charCode == userprefs.keyUP) {
		// 向上浏览
		for(imgIdx = imgList.length - 1; imgIdx >= 0; imgIdx--) {
			var img = imgList[imgIdx];

			/*if(DEBUG) { debugMsg("getY: " + getY(img) + 
								"</br>img.offsetHeight: " + img.offsetHeight +
								"</br>+ = " + (getY(img) + img.offsetHeight) +
								"</br>document.documentElement.scrollTop: " + document.documentElement.scrollTop +
								"</br>window.innerHeight: " + window.innerHeight +
								"</br>+ = " + (document.documentElement.scrollTop + window.innerHeight)); }*/
			// 反向遍历整个list，找到第一个正在当前可视区域的图片，从它开始浏览，而不是从第一个
			if((img.offsetWidth * img.offsetHeight) > (userprefs.minImgW * userprefs.minImgH)) {
				if(getY(img) < document.documentElement.scrollTop + userprefs.margin) {
					// 将之前浏览的那张图片的tabIndex属性清空
					try	{
						curImg.removeAttribute('tabindex');
					}
					catch(err) {
					}

					nextImgIdx = imgIdx;

					// 缩小图片以适应屏幕
					fitImg(imgList[nextImgIdx]);

					if(DEBUG) { debugMsg("Current: " + imgIdx + "</br>Scroll To: " + nextImgIdx + "</br>Total:" + imgList.length + 
										"</br>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
										"</br>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
										"</br>Original(HxW): " + imgList[nextImgIdx].getUserData("origH") + " x " + imgList[nextImgIdx].getUserData("origW") +
										"</br>Resized(HxW): " + imgList[nextImgIdx].height + " x " + imgList[nextImgIdx].width); }

					//滚动到图片
					window.scrollTo(0, getY(imgList[nextImgIdx]) - userprefs.margin);

					//标识当前图片
					curImg = imgList[nextImgIdx];
					imgList[nextImgIdx].setAttribute('tabIndex', 0);
					curImgIdx = nextImgIdx;

					// 寻找到图片并完成滚动，退出循环，等待下个keypress event
					break;
				}
			}
		}

	}
}, true);

// 获得对象左边缘与整个页面左边缘的距离
function getX(obj)
{
	return obj.offsetLeft + (obj.offsetParent ? getX(obj.offsetParent) : obj.x ? obj.x : 0);
}

// 获得对象顶部边缘与整个页面顶部边缘的距离
function getY(obj)
{
	return (obj.offsetParent ? obj.offsetTop + getY(obj.offsetParent) : obj.y ? obj.y : 0);
}

// 缩小图片尺寸到小于窗口可视大小
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
	}
}

function noticeMsg(html)
{
	if(!noticeDIV){
		noticeDIV = document.createElement('div');
		noticeDIV.style.cssText = '\
			position: fixed !important;\
			z-index: 9999999999999 !important;\
			float: none !important;\
			width: auto !important;\
			height: auto !important;\
			font-family: Segoe UI, Arial, Helvetica !important;\
			font-size: 14px !important;\
			padding: 3px 20px 2px 5px !important;\
			background-color: #7f8f9c !important;\
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
	if(!debugDIV){
		debugDIV = document.createElement('div');
		debugDIV.style.cssText = '\
			position: fixed !important;\
			z-index: 9999999999999 !important;\
			float: none !important;\
			width: auto !important;\
			height: auto !important;\
			font-family: Segoe UI, Arial, Helvetica !important;\
			font-size: 14px !important;\
			padding: 3px 20px 2px 5px !important;\
			background-color: #7f8f9c !important;\
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

function addGlobalStyle(css) {
	var head, style;

	head = document.getElementsByTagName('head')[0];
	if (!head) { return; }

	style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = css;
	head.appendChild(style);
}
