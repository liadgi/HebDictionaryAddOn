var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var notifications = require("sdk/notifications");
var selection = require("sdk/selection");
var Request = require("sdk/request").Request;
var data = require("sdk/self").data;
const {XMLHttpRequest} = require("sdk/net/xhr");
var meaning = '';

//const {Cc,Ci} = require("chrome");
//var comp = components.classes["@mozilla.org/moz/jssubscript-loader;1"];
//var service = comp.getService(components.interfaces.mozIJSSubScriptLoader);
//service.loadSubScript("chrome://tests/content/jquery-2.1.0.js");


// The div containing all the translations in both languages
const translationsContainerClassName = "_ctl0_mainContent_milonResultControl_ResultContainer";

// The div box container of each translation
const engTranslationClassName = "translate_box_en box heWord";
const hebTranslationClassName = "translate_result";

// The div containing the interpetation line
const engTranslationDiv = "translation translation_he heTrans";
const hebTranslationDiv = "default_trans";


function getElementsByClassName(className, tagType, element) {
    var elems = element.getElementsByTagName(tagType), i;
    matchingElements = [];
    for (i in elems) {
        if((' ' + elems[i].className + ' ').indexOf(' ' + className + ' ')> -1) {
            matchingElements.push(elems[i]);
        }
    }
    return matchingElements;
}

function getTanslations(translationsContainer, boxDivClassName, translationDiv) {
    var word, translation, boxNumber = 0, string = '';
    var boxContainer = boxDivClassName + boxNumber.toString();
    
    var elems = translationsContainer.getElementsByTagName('div'), i;

    for (i in elems) {
        if( ((' ' + elems[i].className + ' ').indexOf(' ' + boxContainer + ' ')> -1) ||
            ((' ' + elems[i].id + ' ').indexOf(' ' + boxContainer + ' ')> -1)  )
         {
            word = getElementsByClassName("word", "span", elems[i])[0].innerHTML;
            translation = getElementsByClassName(translationDiv, "div", elems[i])[0].innerHTML;
            string += word + ": " + translation + "\n\n";

            boxNumber += 1;
            boxContainer = boxDivClassName + boxNumber.toString();
        }

    }
    return string;
}

function getSuggestions(parent) {
    chain = '';
    var a_hrefs = parent.getElementsByTagName('a'), i;
    for (i in a_hrefs) {
        if (a_hrefs[i].innerHTML) {
          chain += a_hrefs[i].innerHTML + ', ';
        }
    }
    return chain.replace(/\, $/, "");
}

function makeSound() {


}


function showNotification(title, str, url)
{
    notifications.notify({
      title: title,
      text: str,
      onClick: function () {
        if (title != '') {
            tabs.open(url);
        }
        else {
          //makeSound();
        }
      }
    });
}

var alertContentScript = "self.port.on('alert', function(message) {" +
                         "  window.alert(message);" +
                         "})";

alertContentScript = "self.port.on('alert', function(message) {" +
                         "  " +
                         "})";

var panel = require("sdk/panel").Panel({
          width: 180,
          height: 180,
          //contentScript: this.responseXML.getElementById("_ctl0_mainContent_milonResultControl_ResultContainer").outerHTML
          contentURL: data.url("meaning.html"),
          contentScriptFile: data.url("put-text.js")
});

panel.on("show", function() {
  panel.port.emit("entered-text", meaning);
});


function createRequest() {
  if (selection.text) {

    // triming spaces
    var words = selection.text;

    if (words.length > 30) {

      // remove spaces from beginning
      words = words.replace(/^\s/, "");

      // take the first word only
      words = words.substring(0, words.indexOf(" ")); 
    }  

    // removing special characters from the beginning and the end
    words = words.trim().replace(/\.$/, "").replace(/,|:|;$/g, "");
    
    var url = "http://www.morfix.co.il" + "/" + words;
    var req = new XMLHttpRequest();
    req.onload = function () {

        var parent = this.responseXML.getElementById(translationsContainerClassName);

        // check if english words
        if (!words.match('[^\x00-\x80]+')) {
          content = getTanslations(parent, engTranslationClassName, engTranslationDiv);
        }
        // otherwise, hebrew
        else { 
          content = getTanslations(parent, hebTranslationClassName, hebTranslationDiv);
        }

        if (content == '') {
          content = getSuggestions(parent);
          showNotification('Did you mean:', content, url);
        }
        else {
          showNotification('',content);
        }

        /*
        var contentDiv = 'ifrm = document.createElement("IFRAME"); ' +
                      ' ifrm.setAttribute(src, http://google.com/"); ' +
                      ' ifrm.style.width = 640+px; ' +
                      ' ifrm.style.height = 480+px; ' +
                      ' document.body.appendChild(ifrm);';
        alertContentScript = "self.port.on('alert', function(message) {" + contentDiv + "})";
        */
        //panel.show();
    }

    req.open("get", url, true);
    req.responseType = "document";
    req.send();
    
  }
}

selection.on('select', createRequest);