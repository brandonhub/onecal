// background.js

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'html/interface.html', true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return; // or whatever error handling you want
        //document.getElementById('y').innerHTML= this.responseText;
        chrome.tabs.sendMessage(activeTab.id, { "message": "clicked_browser_action",
                                                "assets" : {"interface": this.responseText}
                                              });

    };
    xhr.send();

  });
});