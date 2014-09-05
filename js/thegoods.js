/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 
to do:
make dropdown values dependent on chosen station

add a map?.... nah.
 */

// jQuery to collapse the navbar on scroll
$(window).scroll(function() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }
});

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 750, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});

//wire events
$('.building').click(setStation);
$('#query').click(queryStation);
$('#dropdown').change(updateCount);
$('#commentsSubmit').click(submitFeedback);

function setStation(evt) {  
  $(".building").removeClass("selected");
  $(this).addClass("selected");
  window.location=$("#go").find("a").attr("href"); 
}

function queryStation() {
  var stationId = $(".selected").data("id");
  //direct user to choose a station first
  if (null == stationId) {
    $("#output").html("Please choose a station before trying to retrieve a count.");
    return;
  }

  $("#output").html("Fetching latest data...");

  var bikeQuery = "STATION_ID=" + stationId + " AND AVAILABLEBIKES>0";

  $.ajax({
    url: "//services.arcgis.com/uCXeTVveQzP4IIcx/ArcGIS/rest/services/stationActivity/FeatureServer/1/query",
    data: {
      f: "json",
      outFields: "*",
      orderByFields: "TIMESTAMP",
      where: bikeQuery
    },
    dataType: "json"
  })
    .done(function(data) {
      var mostRecentAttributes = data.features[data.features.length - 1].attributes;
      var lastTime = new Date(mostRecentAttributes.TIMESTAMP).toLocaleString();
      var lastCount = mostRecentAttributes.AVAILABLEBIKES;
      var lastEmpty = mostRecentAttributes.EMPTYSLOTS;

      $("#output").html(lastCount + " available bicycle(s)<br>and " +
        lastEmpty + " empty slot(s)<br>were reported on<br>" + lastTime);
      //console.log(data.features[data.features.length -1])
    })
    .fail(function(err) {
      $("#output").html("Sorry, something went wrong");
      console.log(err);
    });
}

function updateCount(evt) {
  var stationId = $(".selected").data("id");
  var capacity = $(".selected").data("capacity");
  //direct user to choose a station
  if (null == stationId) {
    document.getElementById('jumpToResults').click();
    $("#output").html("Please choose a station before trying to submit a count.");
    return;
  }
  document.getElementById('jumpToComments').click();
  reportedBikeCount = parseInt(evt.target.value);
  derivedEmptySlots = capacity - reportedBikeCount;
}

function submitFeedback() {
  var stationId = $(".selected").data("id");
  //redirect page to output area
  document.getElementById('jumpToResults').click();

  var rightNow = new Date();
  var jsonAdd = {
    "attributes": {
      "STATION_ID": stationId,
      "TIMESTAMP": rightNow,
      "COMMENTS": $('textarea#actualComments').val()
    }
  };

  //direct user to choose a station first
  if (null == stationId) {
    $("#output").html("Please choose a station before trying to submit a count.");
    return;
  }
  //don't send request if count exceeds capacity
  if (stationId != 0 && reportedBikeCount > 1) {
    $("#output").html("You reported more available bikes than we think exist at the station.");
    return;
  }

  //people can report on available bikes at the same time as comments
  if ($('#dropdown').val() > -1) {
    var reportedBikeCount;
    var derivedEmptySlots;
    jsonAdd.attributes.AVAILABLEBIKES = reportedBikeCount;
    jsonAdd.attributes.EMPTYSLOTS = derivedEmptySlots;
  }

  $("#output").html("Sending your data in...");

  $.ajax({
    type: "POST",
    url: "//services.arcgis.com/uCXeTVveQzP4IIcx/ArcGIS/rest/services/stationActivity/FeatureServer/1/applyEdits",
    data: {
      f: "json",
      Adds: "[" + JSON.stringify(jsonAdd) + "]"
    },
    dataType: "json"
  })
    .done(function(data) {
      //to do: check code within response, since AGOL returns errors as 200s
      $("#output").html("Thanks, the information has been submitted successfully.");
    })
    .fail(function(err) {
      $("#output").html("Sorry, we encountered a problem.  please try again later.");
      console.log(err);
    });

  //reset
  $('#dropdown').val(-1)
}