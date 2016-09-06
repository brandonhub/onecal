
mainAppVars = {
  skips: 0,
  skip: 0,
  selection: null,
  root_selector: null,
  stage: 0,
  calendarData: {},
  server: null,
  client: null,
  data: {}
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ){

				// initialize app
				injectFont([ 'Roboto::latin' ])
				initializeDataObject()
        setupElementClickHandling()
        targetServer()

        // load UI into current web
        $wizard = $("<div id = 'extension_container'></div>")
        $wizard.html(request.assets.interface)
        $("body").append($wizard)
        setupInterfaceClickEvents()

        //kickoff workflow
        advanceStage()
        ensureValidUserStatus()  //make sure user is logged in before doing anything
    }
  }
)

function customizeWizard(){

  // setup calendar shit
  $(".supply_calendar_option").hide()

  var calendar_promise = mainAppVars.client.fetchCalendars();
  calendar_promise.then(function(result) {

    console.log("im about to use this: ")
    console.log(result)

    if (result.length > 0){ // if user already has a calendar
      $("#user_has_calendar").show()
      //populate select with data calendars
      for (var cal of result){
        $option = $("<option value = " + cal.id  + ">" + cal.name + "</option>")
        $("#select_calendar_field").append($option)
      }
    }else{    //if user has no calendar
      $("#user_has_no_calendar").show()
    }

  })
}

// make sure user is logged before they use the extension
function ensureValidUserStatus(){

  mainAppVars.client.isAuthenticated().then(function(isAuthenticated) {
    if (isAuthenticated == true) {
      console.log('Authenticated. Token was stored.')
      customizeWizard()  // populate wizard with correct user data
    }
    else{
      console.log("Must log in!")
      showLoginModal()
    }
  });

}

function showLoginModal(){
  $("#extension_overlay").show();
  $("#extension_user").show()
}

//sets up behavior of all buttons and elemtns within the interface
function setupInterfaceClickEvents(){

  /* ---- SETTINGS CLICK EVENTS ---- */

  // MANAGE MODAL
  $("#extension_manage_button").click(function(){
    generateCalendars()
  })
  $("#extension_manage_close_button").click(function(){
    $("#extension_overlay").hide();
    $(".extension_modal").hide();
  })
  $("#extension_manage").on("click", "#create_new_cal_button", function(){
    var calName = $("#create_new_cal_field").val()
    console.log(calName)
    var newCalData = {name: calName}
    mainAppVars.client.createCalendar(newCalData).then(function(calendarData) {
      console.log("New Calendar Added")
      generateCalendars();
    });
  })
  $("#extension_manage").on("click", ".extension_source_title", function(){
    $(".extension_popup").hide();
    var sourceId = $(this).attr("sourceId");

    //fill up select box
    var calendar_promise = mainAppVars.client.fetchCalendars();
    calendar_promise.then(function(result) {

      for (var cal of result){
          $("#move_data_source_select").append($("<option value = " + cal.id + ">" + cal.name + "</option>"))
          $("#move_data_source_button").attr("sourceId", sourceId)
      }
      $(".extension_popup").show();
    })
  })
  $(".extension_popup").on("click", "#move_data_source_button", function(){


    var sourceId = $(this).attr("sourceId")
    var calId = $("#move_data_source_select").val()
    console.log(calId);

    $("#move_data_source_select").empty();
    $(".extension_popup").hide();

    mainAppVars.client.changeDataSourceCalendar(sourceId, calId).then(function(calData){
      $(".extension_popup").hide();
      generateCalendars();
    })

  });

  // CLOSE EXTENSION
  $("#extension_close_button").click(function(){
    closeExtension("", 0);
  })


  // LOGIN
  $("#extension_login").click(function(){

    var email = $("#extension_email").val()
    var password = $("#extension_password").val()

    var auth_data = {
      'email': email,
      'password': password
    }

    console.log(auth_data)

    mainAppVars.client.authenticate(auth_data, false).then(function() { // false means no new user
      console.log('Authenticated. User was logged in.')
      customizeWizard()
      $("#extension_overlay").hide();
      $(".extension_modal").hide();

    });
  })

  // SIGN UP
  $("#extension_sign_up").click(function(){

    var email = $("#extension_email_sign_up").val()
    var password = $("#extension_password_sign_up").val()
    var confirm = $("#extension_password_confirm").val()

    var auth_data = {
      'email': email,
      'password': password
    }

    console.log(auth_data)

    if(password == confirm){
      mainAppVars.client.authenticate(auth_data, true).then(function() { //true means new user
        console.log('Created new user')
        customizeWizard()
        $("#extension_overlay").hide();
        $(".extension_modal").hide();
      });
    }else{
      flashMessage("passwords don't match")
    }

  });


  // LOGOUT
  $("#extension_logout_button").click(function(){
    mainAppVars.client.logoutUser();
    closeExtension("Successfully logged out", 2500);
  })

  //SIGN UP
  $("#extension_sign_up").click(function(){

    email = $("#extension_email").val()
    password = $("#extension_password").val()

    auth_data = {
      'email': email,
      'password': password
    }
  })


  //CONFIRM TITLE
  $("#confirm_title_yes").click(function(){
    mainAppVars.data.root_selector = getAbsoluteSelector(mainAppVars.root_selector);
    mainAppVars.data.repeater_selector = mainAppVars.root_selector.children().first().prop("tagName");

    data_node = {name: "title", selector: null}
    data_node.selector = getDataFieldSelector(mainAppVars.data.root_selector, mainAppVars.selection);  // get selector for this tag
    mainAppVars.data.data_fields.push(data_node)

    advanceStage()
  })
  $("#confirm_title_no").click(function(){
    resetHighlighting();
    rollbackStage()
    ++mainAppVars.skips;
    mainAppVars.skips = mainAppVars.skips;
    findRoot(mainAppVars.selection);
  })


  //CHECK HEADING
  $("#check_heading_yes").click(function(){
    mainAppVars.data["header_first"] = true;
    mainAppVars.root_selector.children().first().addClass("extension_header")
    resetHighlighting()
    mainAppVars.skips = 0;
    mainAppVars.skips = 0;
    advanceStage()
  })
  $("#check_heading_no").click(function(){
    mainAppVars.data["header_first"] = false;
    mainAppVars.skips = 0;
    mainAppVars.skips = 0;
    resetHighlighting()
    advanceStage()
  })


  //CONFIRM DATE
  $("#confirm_date_yes").click(function(){
    data_node = {name: "date", data_format: null, selector: null}
    data_node.selector = getDataFieldSelector(mainAppVars.data.root_selector, mainAppVars.selection);  // get selector for this tag
    mainAppVars.data.data_fields.push(data_node)
    resetHighlighting();
    advanceStage()
  })
  $("#confirm_date_no").click(function(){
    ++mainAppVars.skips;
    mainAppVars.skips = mainAppVars.skips;
    rollbackStage()
    resetHighlighting();
    findRoot(mainAppVars.selection);
  })


  //DATA FORMAT SELECTOR
  $("#supply_data_format_next").click(function(){
    data_node.data_format = $("#data_format_selector").val()
    advanceStage()
  })


  //SUPPLY YEAR
  $("#supply_year_next").click(function(){
    mainAppVars.data.starting_year = $("#year_field").val();
    advanceStage()
  })

  //SUPPLY CALENDAR
  $("#supply_calendar_next").click(function(){
    mainAppVars.calendarData.id = $("#select_calendar_field").val()
    console.log("Main App Cal Data: ")
    console.log(mainAppVars.calendarData)
    advanceStage()
  })
  $("#supply_new_calendar_next").click(function(){

    var calName = $("#new_calendar_name_field").val()
    mainAppVars.calendarData.name = calName

    mainAppVars.client.createCalendar(mainAppVars.calendarData).then(function(calendarData) {
      mainAppVars.calendarData = calendarData
      console.log("Main App Cal Data: ")
      console.log(mainAppVars.calendarData)
    });
    advanceStage()
  })

  //SUPPLY SOURCE NAME
  $("#supply_source_name_next").click(function(){
    mainAppVars.data.name = $("#source_name_field").val();
    sendData();
  })
}

function generateCalendars(){
  $(".extension_modal").hide();
  $("#extension_overlay").show();
  $("#extension_manage").show();

  $("#extension_manage_wrapper").empty()
  var calendar_promise = mainAppVars.client.fetchCalendars();
  calendar_promise.then(function(result) {
    console.log('Generated: ')
    console.log(result)

    for (var cal of result){

      $calendar_container = $("<div class = extension_calendar_container></div>");
      $calendar_container.append($("<br/>"));

      $calendar_container.append($("<div class = extension_calendar_title><i class = 'fa fa-calendar-o'></i> " + cal.name +  "</span>"));
      $calendar_container.append($("<input id = ical_feed_"+ cal.id +" class = 'ical_feed_link' type = 'text' value = http://104.200.24.35:30000/events/calendars/" + cal.id + ".ics />"));
      $calendar_container.append($("<button  class='ical_feed_copy_button' data-clipboard-target= #ical_feed_" + cal.id + " >Copy</button></td></tr>"));
      $calendar_container.append($("<br/>"));

      for (var source of cal.data_sources){
        $calendar_container.append($("<div sourceId = " + source.id + " class = 'source_link extension_source_title'>" + source.name +"&nbsp;<i class='fa fa-folder' aria-hidden='true'></i></span>"));
      }

      $("#extension_manage_wrapper").append($calendar_container)
    }

    var $create_new_cal_form = $('<div id = "create_new_cal_container" > <input placeholder="create new calendar" id = "create_new_cal_field" /> <i id = "create_new_cal_button" class = "fa fa-calendar-plus-o"> </i></div>');
    $("#extension_manage_wrapper").append($create_new_cal_form)

  }, function(err){
    console.log(err)
  })

  console.log("initializing clipboard")
  var clipboard = new Clipboard('.ical_feed_copy_button')

}

//send data object to server to be parsed and sent to iCal feed
function sendData(){
  mainAppVars.data.html = '<html>' + $("html").html() + '</html>';
  console.info("sending data: " + JSON.stringify(mainAppVars.data));

  mainAppVars.client.createDataSource(mainAppVars.data, mainAppVars.calendarData.id).then(function(){
    console.log("data sent successfully")
    advanceStage();
  })
}

//advances workflow of extension
function advanceStage(){
  mainAppVars.stage++
  $(".extension_step").hide()
  $(".extension_step:nth-child(" + mainAppVars.stage + ")").show()
}

//rollback workflow of extension
function rollbackStage(){
  mainAppVars.stage--
  $(".extension_step").hide()
  $(".extension_step:nth-child(" + mainAppVars.stage + ")").show()
}

// Finds repeater container element
function findRoot(elem){
  var $orig = $(elem);
  var parent = $orig.parent();
  var child = $orig;
  var matchFound = false;
  var map = [];

  while(!matchFound){
			if (parent.prop("tagName") == "HTML"){ // TODO: should be checking if parent.parent return DOCUMENT?
				break
			}
      if ($orig.prop("tagName") == "HTML"){ // don't even try if the user selected the HTML tag
        break
      }
      if (parent.children().length > 2){
            parent.children().each(function(i){
                var look = this
                for (step = map.length - 1;  step >= 0;  --step){
                    look = $(look).children()[map[step]]
                }
                if (look != $orig){  // $this should be the current child iterated over
										isMatch = patternFound($orig, look)
                    if(isMatch){
											matchFound = true
										}
                    if (mainAppVars.skips <= 0 && isMatch){  // found a valid match, highlight the element for the user
                      if (i == 0){  //on first row, must check if it's a header row
                        if (!mainAppVars.data["header_first"]){
                          $(look).addClass("extension_outline")
                        }
                      }
                      else{
                        $(look).addClass("extension_outline")
                      }
                    }
                }
            })
            if (mainAppVars.skips > 0 && matchFound){
              --mainAppVars.skips
              matchFound = false
            }
      }

      var nextMapStep = parent.children().index(child)
      map.push(nextMapStep)
      child = parent
      mainAppVars.root_selector = parent
      parent = parent.parent()
  }

	if(matchFound){	// ask user if matches are correct
		advanceStage()
	}else{ // algorithm reached html tag with no matches
		closeExtension("Sorry, we couldn't find matching data for your selection", 2500)
	}
}

// determines whether a matching element has been found
function patternFound(orig, cand){
    var $orig = $(orig)
    var $cand = $(cand)

    if ($orig.prop("tagName") == $cand.prop("tagName")){
        return true
    }
    return false
}

// finds location of a given data field within the repater node
function getDataFieldSelector(root_selector_path, sel){
	selector_path = getAbsoluteSelector($(sel))
	relative_path = selector_path.substring(root_selector_path.length + 3, selector_path.length)

	// trim off first element as it will be the repeater node
	relative_path = relative_path.trim()
	start_index = relative_path.indexOf(' > ') + 3
	relative_path = relative_path.substring(start_index, relative_path.length)

	return relative_path.trim()
}

// finds the location of the container (immediate parent) of the repeater node
function getAbsoluteSelector(element){
	path = ""
	while(element.prop("tagName") != "HTML"){	// keep going until we hit the html tag
		var tagName = element.prop("tagName")
		var all_children = element.parent().children(tagName)	// get all siblings of the same tag type
		var elem_index = all_children.index(element) + 1

		path = " > " + tagName + ":nth-of-type(" + elem_index + ")" + path
		element = element.parent()

	}
	path = "HTML" + path
	return path
}

// injects custom font-family into page assets
function injectFont(fontFamilies){
	WebFontConfig = {
    google: { families: fontFamilies }
  };
  (function() {
    var wf = document.createElement('script');
    wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
	})
}


//configure raw html to interact with user clicks
function setupElementClickHandling(){

  // setup click events
  $("body *").addClass("clickable_element")	// all elements besides wizard will be clickable

  // setup element highlighting
  $('.clickable_element').mouseover(function(e){
      if (elementsClickable()){
        e.stopPropagation()
        $(".extension_outline").removeClass("extension_outline")
        $(e.target).addClass("extension_outline")
      }
  }).mouseout(function(e) {
    if (elementsClickable()){
      $(e.target).removeClass("extension_outline")
    }
  })

  // setup element click event
  $(".clickable_element").on('click', function(e) {
      if (elementsClickable()){
        mainAppVars.selection = $(e.target)
        console.log("selection: " + mainAppVars.selection.prop("tagName"))
        findRoot(mainAppVars.selection)
      }
  })
}

function flashMessage(msg){
  $message = $("<span>" + msg + "</span>");
  $(".extension_flash").append($message);
  $(".extension_flash span").delay(2500).fadeOut()
}

//initializes date object with default values
function initializeDataObject(){
  	mainAppVars.data = {  // eventually will hold all information needed by backend
  		"starting_year": null,
  		"url": window.location.href,
  		"name": null,
  		"repeater_selector": null,
  		"root_selector": null,
  		"header_first": false,
  		"data_fields": []
  	}
}

function targetServer(){
  mainAppVars.server = 'http://104.200.24.35:30000';
  mainAppVars.client = new APIClient(mainAppVars.server);
}

//checks if usrs are currently able to select elements on the page
function elementsClickable(){
  if($("#extension_settings").is(":visible")){
    return false
  }
  if ( !$("extension_settings").is(":visible") &&
      ($("#select_title").is(":visible") || $("#select_date").is(":visible"))){ //should only be able to select elements when wizard is asking them to
    return true
  }
  return false
}

//removes all highlights from page
function resetHighlighting(){
  $(".extension_outline").removeClass("extension_outline");
}

//shows specified explanation and then closes exntension after a few seconds
function closeExtension(explanation, delay){
  // reset constants
  mainAppVars.skips = 0
  mainAppVars.skips = 0
  mainAppVars.selection = null
  mainAppVars.root_selector = null
  mainAppVars.stage = 0

  initializeDataObject()

  $("#wizard_interface").html(explanation)
  $("#extension_container").delay(delay).fadeOut().queue(function() {
      $(this).remove()
  })
}

/* TODO:
- changeDataSource
*/

/* idea for later: whenever advanceStage is called, simply broadcast a message to another file which will listen
for the name of the step_container or number or whatever that is active. Then you can handle creating resepctive
listeners and shit there */