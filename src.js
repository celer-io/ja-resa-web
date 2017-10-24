$(document).ready(function() {
    // page is now ready, initialize the calendar...

    $('#calendar').fullCalendar({
      businessHours: [
        {
          dow: [ 1, 2, 3, 4, 5, 6 ],
          start: '10:00',
          end: '23:00'
        },
        {
          dow: [ 0 ],
          start: '14:00',
          end: '20:00'
        }
      ],
      allDaySlot: false,
      height: 725,
      minTime: '10:00',
      maxTime: '23:00',
      defaultView: 'agendaWeek',
      dayClick: openEditForm,
      events: [
        {
          title  : 'truc',
          start  : '2017-10-27T12:00:00',
          end  : '2017-10-27T14:00:00'
        },
        {
          title  : 'machin',
          start  : '2017-10-27T14:00:00',
          end  : '2017-10-27T16:00:00'
        }
      ]
    })

});

function openEditForm(date) {
  $('#edit-form').toggleClass('is-active')
  console.log('date :', date)
}

function closeEditForm() {
  $('#edit-form').toggleClass('is-active')
}
