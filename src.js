$(document).ready(function() {
    console.log("heyyyyysssssssssssse")
    // page is now ready, initialize the calendar...

    $('#calendar').fullCalendar({
      events: [
        {
          title  : 'event1',
          start  : '2017-10-01'
        },
        {
          title  : 'event2',
          start  : '2017-10-02',
          end    : '2017-10-03'
        },
        {
          title  : 'event3',
          start  : '2017-10-02T12:30:00',
          end  : '2017-10-02T13:30:00',
          allDay : false // will make the time show
        }
      ]
        // put your options and callbacks here
    })

});
