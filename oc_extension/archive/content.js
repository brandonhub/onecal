// Global Variable Declerations
var state = "STEP1";  // keep track of what stage of workflow the user is
var skips = 0;	// keep track of how many skips have taken place
var skip = 0;	// keep track of the depth to which the algorithm must go down the tree to reach the correc level
var selection = null; // global variable to maintain selected element
var root_selector = null; // global variable to eventully hold repeator container
var repeater_container = null;	// will hold element in which the repeater nodes reside
var starting_level = null; //  will indicate at which level to start mathing elements after the first match is found
var data = {}

// state contants
StateEnum = {
    STEP1 : "STEP1",
		STEP2 : "STEP2",
		STEP3 : "STEP3",
		STEP4 : "STEP4",
		STEP5 : "STEP5",
		STEP6 : "STEP6",
		STEP7 : "STEP7",
		STEP8 : "STEP8",
		LIMBO : "LIMBO"
}


function initializeDataObject(){
	data = {  // eventually will hold all information needed by backend
		"starting_year": null,
		"url": window.location.href,
		"name": null,
		"repeater_selector": null,
		"root_selector": null,
		"header_first": false,
		"data_fields": []
	}
}

function initializeState(){
	state = StateEnum.STEP1;
	skips = 0;
	skip = 0;
	selection = null;
	root_selector = null;
	repeater_container = null;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ){

				// initialize app
				setupFont();
				initializeDataObject();
				initializeState()

				// setup click events
				$("body *").addClass("clickable_element")	// all elements besides wizard will be clickable

				// setup element highlighting
				$('.clickable_element').mouseover(function(e){
						if (elementsClickable()){
							e.stopPropagation();
					    $(".extension_outline").removeClass("extension_outline");
					    $(e.target).addClass("extension_outline");
						}
				}).mouseout(function(e) {
					if (elementsClickable()){
				  	$(e.target).removeClass("extension_outline");
					}
				});

				// setup element click event
				$(".clickable_element").on('click', function(e) {
						if (elementsClickable()){
							selection = $(e.target)
							console.log("selection: " + selection.prop("tagName"))
							nextClick();
						}
				});

	      // create wizard container
	      $wizard = $("<div id = 'wizard'></div>");
	      $wizard.html('<span id = "text_holder">Ok, lets get started. Please select the title of an assignment</span>');

	      // create next button, button is set to unselectable so that user selecton is not destroyed upon clicking
				$buttonHolder = $("<div id = 'button_holder'></div>");
	      $nextButton = $("<span class = 'button' id = 'next_button'>Next</span>");
				$nextButton.hide()
	      $cancelButton = $("<span class ='button' id = 'cancel_button'>Cancel</span>");
        $cancelButton.hide()
				$buttonHolder.append($nextButton).append($cancelButton);

	      // program next button behavior and add UI to wizard
	      $nextButton.on('mousedown', nextClick);
	      $cancelButton.on('mousedown', cancelClick);
	      $wizard.append($buttonHolder);
	      $("body").append($wizard);

    }
  }
);

function elementsClickable(){
  return (state == StateEnum.STEP1 || state == StateEnum.STEP4)
}

// Finds repeater container element
function findRoot(elem){
	console.log("finding root for: " + elem)
  var $orig = $(elem);
  var parent = $orig.parent();
  var child = $orig;
  var matchFound = false;
  var map = [];

  while(!matchFound){
			if (parent.prop("tagName") == "HTML"){
				console.log("Found no matches");
				break;
			}
      if (parent.children().length > 2){
            parent.children().each(function(i){
                var look = this;
                for (step = map.length - 1 ; step >= 0  ; --step){
                    look = $(look).children()[map[step]];
                }
                if (look != $orig){  // $this should be the current child iterated over
										isMatch = patternFound($orig, look);
                    if(isMatch){
											matchFound = true;
										}
                    if (skip <= 0 && isMatch){  // found a valid match, highlight the element for the user
                      if (i == 0){  //on first row, must check if it's a header row
                        if (!data["header_first"]){
                          $(look).addClass("extension_outline");
                        }
                      }
                      else{
                        $(look).addClass("extension_outline");
                      }
                    }
                }
            });
            if (skip > 0 && matchFound){
              --skip;
              matchFound = false;
            }
      }

      var nextMapStep = parent.children().index(child);
      map.push(nextMapStep);
      child = parent;
      root_selector = parent;
			if (parent.prop("tagName") == "HTML"){	//no more dom to traverse
				break;
			}
      parent = parent.parent();

  }

	if(matchFound){	// ask user if matches are correct
		changeWizardText("Here's what we've found? Is this correct?")
		$("#next_button").show();
    $("#cancel_button").show()
		$("#next_button").text("Yes");
		$("#cancel_button").text("No");
	}else{
		$("#next_button").remove()
		$("#cancel_button").remove()
		changeWizardText("We weren't able to find any matching data for your selection. Please try again with another element")
		$("#wizard").delay(2500).fadeOut().queue(function() {
				$(this).remove();
		});
		state = StateEnum.LIMBO

	}

}

// determines whether a matching element has been found
function patternFound(orig, cand){
    var $orig = $(orig);
    var $cand = $(cand);

    if ($orig.prop("tagName") == $cand.prop("tagName")){
        return true;
    }
    return false;
}

// advances workflow
function nextClick(){
  switch(state) {
    case StateEnum.STEP1:
        changeState(StateEnum.STEP2);
        findRoot(selection);
        break;

    case StateEnum.STEP2:
      changeState(StateEnum.STEP3)
      data["root_selector"] = getAbsoluteSelector(root_selector);
      data["repeater_selector"] = root_selector.children().first().prop("tagName");

      title_node = {name: "title"}
      title_node["selector"] = getDataFieldSelector(data["root_selector"], selection);  // get selector for this tag
      data["data_fields"].push(title_node)

      changeWizardText("Were headings for the date and title selected by onecal?");

      var $headings_selector = `<select class = "input_field" id = 'headings_selector'>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>`

      $("#button_holder").prepend($headings_selector);
      $("#next_button").text("Next")
      $("#cancel_button").hide()
      break;
    case StateEnum.STEP3:
        console.log("3")
        changeState(StateEnum.STEP4);

        if ($('#headings_selector').val() == "yes") {
          data["header_first"] = true;
          root_selector.children().first().addClass("onecal_header")
        } else {
          data["header_first"] = false;
        }
  			$('#headings_selector').remove()

				$("#next_button").hide();

        changeWizardText("Sweet, now select a date")
        $(".extension_outline").removeClass("extension_outline");


				skips = 0;
        skip = 0;

        break;

    case StateEnum.STEP4:
      changeState(StateEnum.STEP5);
      findRoot(selection);
      break;

    case StateEnum.STEP5:
      changeState(StateEnum.STEP6)

      date_node = {data_format: null, name: "date"}
			date_node["selector"] = getDataFieldSelector(data["root_selector"], selection)

      $("#next_button").text("Next");
      $("#cancel_button").hide();
			$("#next_button").show();
			$(".extension_outline").removeClass("extension_outline")
      changeWizardText("Almost done! Please supply the year for this syllabus and click 'Next'");
      $yearField = $('<input class = "input_field" type = "text" id = "year_field"></input>');
      $("#button_holder").prepend($yearField);
      break;

    case StateEnum.STEP6:
      changeState(StateEnum.STEP7)
      data["starting_year"] = $("#year_field").val();
			$("#year_field").remove()
      changeWizardText("Now please choose the format of the dates for assignments on the syllabus and click 'Next'");

			var $format_selector = `<select class = "input_field" id = 'format_selector'>
																<option value="%B %d">August 01</option>
																<option value="%b %d">Aug 01 </option>
																<option value="%m/%d">07/01</option>
															</select>`

			$("#button_holder").prepend($format_selector);
      $("#next_button").text("Next");
      break;

    case StateEnum.STEP7:
      changeState(StateEnum.STEP8);
      date_node["data_format"] = $('#format_selector').val();
      data["data_fields"].push(date_node);
			$('#format_selector').remove()

      changeWizardText("We've got your data, now just give this source a name and we'll send everything over to your calendar feed")

			$titleField = $('<input class = "input_field" type="text" id="title_field"></input>');
      $("#button_holder").prepend($titleField);
			$("#next_button").text("Done");

      break;

		case StateEnum.STEP8:
      data["name"] = $("#title_field").val();
			$("#title_field").remove();

			data["html"] = '<html>' + $("html").html() + '</html>';

			$.ajax({
					url: 'http://127.0.0.1:8000/events/calendars/1/sources/',
					type: 'post',
					data: JSON.stringify(data),
					headers: {
						'Authorization': 'Token PLACEHOLDER',
						'Content-Type': 'application/json',
					},
					dataType: 'json',
					success: function (data) {
							console.info("successfully sent: " + data);
					}
			});

			changeWizardText("Assignment data has been sent to your calendar feed!");
      console.log(data)
			$("#next_button").remove();
			$("cancel_button").remove();
			$(".extension_outline").removeClass("extension_outline");
			$("#wizard").delay(2500).fadeOut().queue(function() {
          $(this).remove();
      });
			break;

    default:
      console.log("default triggered")
  }
}

function cancelClick(){
    switch(state) {
        case StateEnum.STEP1:
						// close the exntension
            $("#wizard").remove();
						state = StateEnum.LIMBO
            break;

        case StateEnum.STEP2:
            $(".extension_outline").removeClass("extension_outline"); // remove highlights
            ++skips;
            skip = skips;
            findRoot(selection);   // start over, making sure to skip this level next time
            break;

        case StateEnum.STEP4:
						// close the exntension
            $("#wizard").remove();
						state = StateEnum.LIMBO
            break;

        case StateEnum.STEP5:
            $(".extension_outline").removeClass("extension_outline"); // remove highlights
            ++skips;
            skip = skips;
            findRoot(selection);   // start over, making sure to skip this level next time
            break;

        default:  // close the exntension
          console.log("default triggered")
					$("#wizard").remove();
					state = StateEnum.LIMBO
    }
}

function getDepthOfElement(elem){
  var depth = 0;
  while (elemt.parent().prop("tagName") != "HTML"){
    elem = element.parent();
    depth++
  }
  return depth;
}


function getDataFieldSelector(root_selector_path, sel){
	selector_path = getAbsoluteSelector($(sel));
	relative_path = selector_path.substring(root_selector_path.length + 3, selector_path.length)

	// trim off first element as it will be the repeater node
	relative_path = relative_path.trim();
	start_index = relative_path.indexOf(' > ') + 3;
	relative_path = relative_path.substring(start_index, relative_path.length)

	return relative_path.trim();
}



function getAbsoluteSelector(element){
	path = "";
	while(element.prop("tagName") != "HTML"){	// keep going until we hit the html tag
		var tagName = element.prop("tagName")
		var all_children = element.parent().children(tagName)	// get all siblings of the same tag type
		var elem_index = all_children.index(element) + 1;

		path = " > " + tagName + ":nth-of-type(" + elem_index + ")" + path;
		element = element.parent();

	}
	path = "HTML" + path;
	return path;
}

// injects roboto font-family into page assets
function setupFont(){
	WebFontConfig = {
    google: { families: [ 'Roboto::latin' ] }
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

function changeWizardText(text){
  $("#text_holder").text(text);
}

function changeState(text){
  state = text;
}

/*  TODO
- dont reset skips, reset parent level
- clean up code
- clean up workflow bugs
 */