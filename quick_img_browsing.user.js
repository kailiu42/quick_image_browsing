// ==UserScript==
// @name           Quick Img Browsing
// @namespace      kraml
// @include        *
// ==/UserScript==

var DEBUG = true;

// 快捷键
var KEY_UP = 107; // k
var KEY_DOWN = 106; // j
var KEY_VIEW_ORIGIN = 118; // v
// 105 i 117 u

//滚动页面到图片时，图片边缘的与可视区域的上下边距
var margin = 10;

// 最小图片尺寸。小于此大小的图片将会在浏览时跳过
var minImgWidth = 200;
var minImgHeight = 200;

// 最大图片尺寸。大于（任一维度大于最大值时）此大小的图片将会被缩小
var maxImgWidth = self.innerWidth; // 如果图片页面在一个frame内，self取得的是frame的尺寸。如果使用window.innerWidth取得的是顶层窗口的尺寸
var maxImgHeight = self.innerHeight;

// 图片尺寸大于上面的最大尺寸时，将会被缩小到不超过如下尺寸
var adequateImgWidth = maxImgWidth - 2 * margin - 20;
var adequateImgHeight = maxImgHeight - 2 * margin - 20;

var eve;
var noticeDIV;
var debugDIV;

var $ = function(o){ return document.querySelectorAll(o); }

document.addEventListener('keypress', function(event) {
	// if(DEBUG) { debugMsg(event.charCode); }
	var imgList = $("img");
	var currentImg = $("img[tabindex]")[0];
	// if(event.charCode == 111) { currentImg.focus(); }
	// if(event.charCode == KEY_VIEW_ORIGIN) { document.location.href = currentImg.src; }

	if(event.charCode == KEY_DOWN || event.charCode == KEY_UP) {
		for(imgIdx = 0; imgIdx < imgList.length; imgIdx++){
			// GM_log(imgList[imgIdx].offsetTop);
			var img = imgList[imgIdx];
			/* if(img.offsetTop > document.documentElement.scrollTop && (img.offsetWidth * img.offsetHeight) > 95000) {
				if(event.charCode==117){var scrollToImgIdx=imgIdx;}else{var scrollToImgIdx=imgIdx-2;}
				if(patrn(window.location.href,"psp\.duowan\.com"))
					{window.scrollTo(0,imgList[scrollToImgIdx].offsetTop-40);}
				else if (patrn(window.location.href,"67\.220\.92\.21"))
					{window.scrollTo(0,imgList[scrollToImgIdx].offsetTop+231);}
				else if (patrn(window.location.href,"www\.mm2you\.com"))
					{window.scrollTo(0,imgList[scrollToImgIdx].offsetTop+200);}
				else if (patrn(window.location.href,"www\.thirtythr33\.de"))
					{window.scrollTo(0,imgList[scrollToImgIdx].offsetTop+120);}
				else
					{window.scrollTo(0,imgList[scrollToImgIdx].offsetTop);}
				break;
			}
			*/
			// if(getY(img) > document.documentElement.scrollTop && (img.offsetWidth * img.offsetHeight) > 95000){
			
			// 找到的第一个Y坐标大于页面的已卷过的高度+margin的图片，也就是当前正看到的图片。并且大小足够大
			if(getY(img) > document.documentElement.scrollTop + margin && (img.offsetWidth * img.offsetHeight) > minImgWidth * minImgHeight){
				if(event.charCode == KEY_DOWN) {
					var scrollToImgIdx = imgIdx;
				} else {
					var scrollToImgIdx = imgIdx - 2; // 减2因为进入到这个for循环时imgIdx已经++了
				}

				// if(DEBUG) { debugMsg("ImgHeight: " + imgList[scrollToImgIdx].height + "</br>ImgWidth: " + imgList[scrollToImgIdx].width); }
				//缩小图片以适应屏幕
				if(imgList[scrollToImgIdx].height > maxImgHeight) { imgList[scrollToImgIdx].height = adequateImgHeight; }
				if(imgList[scrollToImgIdx].width > maxImgWidth) { imgList[scrollToImgIdx].height = adequateImgWidth; }

				//滚动到图片
				window.scrollTo(0, getY(imgList[scrollToImgIdx]) - margin);

				//标识当前图片
				try	{
					currentImg.removeAttribute('tabindex');
					imgList[scrollToImgIdx].setAttribute('tabindex',0);
				}
				catch(err) {
					imgList[scrollToImgIdx].setAttribute('tabindex',0);
				}

				if(DEBUG) { debugMsg("Current: " + imgIdx + "</br>Scroll To: " + scrollToImgIdx + "</br>Total:" + imgList.length); }
				// 完成一次滚动，退出循环
				break;
			}
 			//alert(imgIdx + " / " + imgList.length);

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
/*	else if(event.charCode==100){
		for(imgIdx=0;imgIdx<imgList.length;imgIdx++){
			var img=imgList[imgIdx]
			if(img.offsetTop > document.documentElement.scrollTop && (img.src.indexOf('torrent') > 0 || img.src.indexOf('rar') > 0 )){
				window.scrollTo(0,img.offsetTop);
				break;
			}
		}
	}
*/
}, true);


function turnPage()
{
	if(eve == 106) {
		var int = Math.round(arguments[1]) + 1;
		return "/" + int;
	}
	else {
		var int = Math.round(arguments[1]) - 1;
		return "/" + int;
	}
}

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

function noticeMsg(html){
	if(!noticeDIV){
		noticeDIV = document.createElement('div');
		noticeDIV.style.cssText = '\
			position: fixed !important;\
			z-index: 9999999999999 !important;\
			float: none !important;\
			width: auto !important;\
			height: auto !important;\
			font-size: 14px !important;\
			padding: 3px 20px 2px 5px !important;\
			background-color: #7f8f9c !important;\
			border: none !important;\
			color: #000 !important;\
			text-align: left !important;\
			left: 0 !important;\
			bottom: 0 !important;\
			border-radius: 0 6px 0 0! important;\
			-moz-border-radius: 0 6px 0 0 !important;\
			-o-transition: opacity 0.3s ease-in-out;\
			-webkit-transition: opacity 0.3s ease-in-out;\
			-moz-transition: opacity 0.3s ease-in-out;\
		';
		document.body.appendChild(noticeDIV);
	};
	noticeDIV.innerHTML=html;
};

function debugMsg(html){
	if(!debugDIV){
		debugDIV = document.createElement('div');
		debugDIV.style.cssText = '\
			position: fixed !important;\
			z-index: 9999999999999 !important;\
			float: none !important;\
			width: auto !important;\
			height: auto !important;\
			font-size: 14px !important;\
			padding: 3px 20px 2px 5px !important;\
			background-color: #7f8f9c !important;\
			border: none !important;\
			color: #000 !important;\
			text-align: left !important;\
			left: 0 !important;\
			bottom: 0 !important;\
		';
		document.body.appendChild(debugDIV);
	};
	debugDIV.innerHTML = html;
};
