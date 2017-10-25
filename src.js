$(document).ready(function() {
    // page is now ready, initialize the calendar...
    flatpickr.localize(flatpickr.l10ns.fr);

    $('#calendar').fullCalendar({
      customButtons: {
        addEvent: {
          text: 'Ajouter une reservation',
          click: function() {
            openEditForm(moment())
          }
        }
      },
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'addEvent'
      },
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
      slotDuration: '01:00',
      minTime: '10:00',
      maxTime: '23:00',
      defaultView: 'agendaWeek',
      validRange: function(currentDate) {
        return {
          start: currentDate.clone().subtract(1, 'days'),
          end: currentDate.clone().add(3, 'weeks')
        }
      },
      dayClick: openEditForm,
      events: [
        {
          title  : 'truc',
          start  : '2017-10-27T12:00:00',
          end  : '2017-10-27T14:00:00'
        },
        {
          title  : 'machin',
          start  : '2017-10-27T14:30:00',
          end  : '2017-10-27T16:30:00'
        }
      ]
    })
});

function openEditForm(date) {
  console.log('date :', date)
  $('#edit-form').toggleClass('is-active')
  $("#day").flatpickr({
    dateFormat: 'l d F Y',
    defaultDate: date.toDate(),
    minDate: new Date(),
    maxDate: moment().add(3, 'weeks').toDate()
  })
}

function closeEditForm() {
  $('#edit-form').toggleClass('is-active')
}
