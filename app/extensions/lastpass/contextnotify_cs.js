function do_save_site_success_msg(a){if(g_show_save_success_msg){var d={waitms:1500,loc:"ur",id:"__lpsavemsgdiv",msg:lpgs("You have saved your password to your LastPass Vault.")};return popup_notification_msg(a,d)}return!1}function do_iframe_sad_msg(a){if(g_show_safari_csp_msg){var d={waitms:3500,loc:"urv",id:"__lpsadmsgdiv",msg:lpgs("The LastPass popup has been blocked from loading on this site. Please fill using the LastPass Icon.")};return popup_notification_msg(a,d)}return!1}
function popup_notification_msg(a,d){a||(a=LP_derive_doc());if(!a||!d)return!1;var b=d.loc,c=d.id,k=d.waitms,h=d.msg,l=sprintf;"undefined"!=typeof g_isie&&g_isie&&(init_LPfn(),LPfn&&(l=LPfn.sprintf));var j=window;!j&&"undefined"!=typeof LP&&(j=LP.getBrowser().ContentWindow);if(!a||!d||!h||!c||!b||!j)return!1;var g=a.createElement("DIV");g.id=c;if(g_40notify){var e=a.createElement("div");e.style.height="12px";e.style.backgroundColor=g_40colors.header;var f=a.createElement("img");f.src=g_40_icons["8x8"];
f.style.cssText="vertical-align:top !important; margin:2px !important;";e.appendChild(f);f=a.createElement("div");f.style.cssText="position:absolute !important; border-style:transparent !important; border-width:1px !important; border-color:transparent !important; font-size:9px; font-family: Arial,Helvetica,sans-serif; height:11px !umportant ; width: 11px !important; top:0px !important; right:0px !important; background-color: transparent; margin: 0 !important; ; padding: 0px 2px !important; text-align:center; cursor: pointer; color: white; display:inline-block;";
LP_elt_set_text(f,"X");e.appendChild(f);g.appendChild(e)}else f=a.createElement("div"),f.style.cssText="position:absolute !important; border-style:transparent !important; border-width:1px !important; border-color:transparent !important; font-size:9px; font-family: Arial,Helvetica,sans-serif; height:11px !umportant ; width: 11px !important; top:0px !important; right:0px !important; background-color: transparent; margin: 0 !important; ; padding: 0px 2px !important; text-align:center; cursor: pointer; ",
LP_elt_set_text(f,"X"),g.appendChild(f);e=a.createElement("div");e.id=c+"_text";g.appendChild(e);g_40notify&&(e.style.cssText="padding: 5px 5px 5px 15px !important;");h&&LP_elt_set_text(e,h);e=LP_getWindowWidth(j);if(!e)return!1;(c=LP_getWindowHeight(j))||(c=0);h=c=0;switch(b){case "ul":h=c="25px";break;case "ulv":c=25+LP_pos_viewport(j)[0]+"px",h=25+LP_pos_viewport(j)[1]+"px";case "dock":break;case "urv":c=e-parseInt("210px")-30+"px";h=25+LP_pos_viewport(j)[1]+"px";break;default:c=e-parseInt("210px")-
30+"px",h="25px"}b="position:absolute !important; visibility:visible !important; z-index:"+CLICKABLE_ICON_ZINDEX+" !important; border-style:transparent !important; border-width:1px !important; border-color:#4c4c4c !important; font-size:14px; font-family: Arial,Helvetica,sans-serif; width: 210px !important; top:"+h+" !important; left:"+c+" !important; background-color: #e6e6e6; margin: 4px !important; border-radius: 4px; padding: 5px 5px 5px 15px !important; background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3BpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMi1jMDAxIDYzLjEzOTQzOSwgMjAxMC8xMC8xMi0wODo0NTozMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpDQ0JFNTgxNzA4MjA2ODExOTJCMEZBNzdDQkU2Qjg4RiIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo1RTA4N0Y4OEZCQUYxMUUyOTAyNEMwRUQyN0ZDRTk1QyIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo1RTA4N0Y4N0ZCQUYxMUUyOTAyNEMwRUQyN0ZDRTk1QyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgRWxlbWVudHMgMTEuMCBNYWNpbnRvc2giPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyMEEzMzFENkUxMjA2ODExOTJCMEZBNzdDQkU2Qjg4RiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDQ0JFNTgxNzA4MjA2ODExOTJCMEZBNzdDQkU2Qjg4RiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqEZ7U4AAAAwUExURfL6+uHMzaoWLIoDFKVJJ2oEFsQaK7cCHMtfaNWrEcFJOsg2PsqnqdWGi584RAAAAIK7gZ4AAAAQdFJOU////////////////////wDgI10ZAAAAWUlEQVR42jzMUQ4AMQQEUKpoFnX/2+403exEZN4H1DHsZjQ9/kcOgsN4fVhURXVhxkRsBkxnPmCOg8xEzRyAuAOJEwVk0cIPAbbIriG5D6Zi31Fq/dOvAAMADDMDTO9yI2MAAAAASUVORK5CYII=); background-repeat:no-repeat; background-position: left top;background-attachment: scroll;";
b="undefined"!=typeof g.style.opacity?b+"opacity: 1.0;":b+"filter:alpha(opacity=100)";g_40notify&&(l=l("url(%s)",g_40_icons["8x8"]),b="position:absolute !important; visibility:visible !important; z-index:"+CLICKABLE_ICON_ZINDEX+" !important; border-style:transparent !important; border-width:1px !important; border-color:#4c4c4c !important; font-size:14px; font-family: Arial,Helvetica,sans-serif; width: 210px !important; top:"+h+" !important; left:"+c+" !important; background-color: #e6e6e6; margin: 0px !important; padding:0px !important; border-radius: 4px; background-image:"+
l+"; background-repeat:no-repeat; background-position: left top;background-attachment: scroll;",b="undefined"!=typeof g.style.opacity?b+"opacity: 1.0;":b+"filter:alpha(opacity=100)");g.style.cssText=b;"undefined"!=typeof a.body?a.body.appendChild(g):a.getElementById("main")&&a.getElementById("main").appendChild(g);k&&("number"==typeof k&&0<k)&&setTimeout(function(){close_popup_notification_msg(a,g.id,0);return!1},k);LP_addEventHandler(f,"click",function(){close_popup_notification_msg(a,g.id,null);
return!1});return!0}
function close_popup_notification_msg(a,d,b){a||(a=LP_derive_doc());if(!a||!d)return!1;var c=a.getElementById(d);if(c){"undefined"==typeof b?b=0:"string"==typeof b&&(b=parseInt(b));if(null===b||isNaN(b))return c.parentNode.removeChild(c),!1;b<FADE_MAXSTATES?("undefined"!=typeof c.style.opacity?c.style.opacity=(100-100/FADE_MAXSTATES*(b+1))/100:c.style.filter="alpha(opacity="+(100-20*(b+1))+")",b++,setTimeout(function(){close_popup_notification_msg(a,c.id,b);return!1},10)):c.parentNode.removeChild(c)}return!1}
function destroy_save_site_success_msg(a,d,b){return close_popup_notification_msg(a,d,b)}var MSGDIVID="__lpsuggestmsgdiv";function do_save_suggest_msg(){}var g_tutorial_flags,TUTORIAL_FLAG_LPOV=1,TUTORIAL_FLAG_CONTEXT=2,g_context_tip_shown=0;function draw_context_tip(){}function destroy_save_suggest_msg(){return!1};