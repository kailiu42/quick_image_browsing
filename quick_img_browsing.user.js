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

var initialized = false;

var $ = function(o){ return document.querySelectorAll(o); }

function init()
{
	if(!initialized) {
		imgList = document.querySelectorAll("img");
		curImg = document.querySelectorAll("img[tabindex]")[0];

		addGlobalStyle('img[tabindex=0] { border: 3px !important; border-color: #7f8f9c !important;}');

		initialized = true;
	}
}

document.addEventListener('keypress', function(event) {
	init();
	// if(DEBUG) { debugMsg(event.charCode); }
	// if(event.charCode == userprefs.KEY_VIEW_ORIGIN) { document.location.href = curImg.src; }

	if(event.charCode == userprefs.keyDown || event.charCode == userprefs.keyUP) {
		for(imgIdx = 0; imgIdx < imgList.length; imgIdx++){
			var img = imgList[imgIdx];

			// 找到的第一个Y坐标大于页面的已卷过的高度+margin的图片，也就是当前正看到的图片。并且大小足够大
			if(getY(img) > document.documentElement.scrollTop + userprefs.margin && (img.offsetWidth * img.offsetHeight) > (userprefs.minImgW * userprefs.minImgH)){
				if(event.charCode == userprefs.keyDown) {
					var scrollToImgIdx = imgIdx;
				} else {
					var scrollToImgIdx = imgIdx - 2; // 减2因为进入到这个for循环时imgIdx已经++了
					alert(scrollToImgIdx);
				}

				// 缩小图片以适应屏幕
				fitImg(imgList[scrollToImgIdx]);

				if(DEBUG) { debugMsg("Current: " + imgIdx + "</br>Scroll To: " + scrollToImgIdx + "</br>Total:" + imgList.length + 
									"</br>Max(HxW): " + MAX_IMG_H + " x " + MAX_IMG_W +
									"</br>Adequate(HxW): " + ADEQUATE_IMG_H + " x " + ADEQUATE_IMG_W +
									"</br>Original(HxW): " + imgList[scrollToImgIdx].getUserData("origH") + " x " + imgList[scrollToImgIdx].getUserData("origW") +
									"</br>Resized(HxW): " + imgList[scrollToImgIdx].height + " x " + imgList[scrollToImgIdx].width); }

				//滚动到图片
				window.scrollTo(0, getY(imgList[scrollToImgIdx]) - userprefs.margin);

				//标识当前图片
				try	{
					curImg.removeAttribute('tabindex');
					imgList[scrollToImgIdx].setAttribute('tabindex', 0);
				}
				catch(err) {
					imgList[scrollToImgIdx].setAttribute('tabindex', 0);
				}

				// 完成一次滚动，退出循环
				break;
			}

			// 到达最后一张图片，显示提示信息
			/*
			if(imgIdx == imgList.length - 1) {
				document.getElementById("imgMessage").style.display = "inline";
				var mTop=document.documentElement.scrollTop + 200
				document.getElementById("imgMessage").style.top = mTop + "px";
			}*/
			//else if(imgList[imgIdx].offsetTop = document.documentElement.scrollTop){
				//if(event.charCode==108){var scrollToImgIdx=imgIdx+2;}else{var scrollToImgIdx=imgIdx-1;}
				//window.scrollTo(0,imgList[scrollToImgIdx].offsetTop);
				//break;
			//}
		}
	}
}, true);

// 对象的X坐标
function getX(obj)
{
	return obj.offsetLeft + (obj.offsetParent ? getX(obj.offsetParent) : obj.x ? obj.x : 0);
}

// 对象的Y坐标
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
