/* global $, flatpickr, moment */
$(document).ready(function () {
  const apiUrl = 'http://demo6943786.mockable.io/'
  const midnightReset = {
    'hour': 0,
    'minute': 0,
    'second': 0,
    'milisecond': 0
  }

  let currentRoom = 'music'
  let selectedDay = moment().set(midnightReset)
  let editedEvent = {
    id: null,
    title: null,
    start: null,
    end: null,
      // email: null,
    tel: null,
    password: null
    // ,
    // comment: null
  }

  $('.room[data-room="' + currentRoom + '"').toggleClass('is-active')

  flatpickr.localize(flatpickr.l10ns.fr)

  const dayPicker = $('#day').flatpickr({
    dateFormat: 'l d F Y',
    minDate: moment().set(midnightReset).toDate(),
    maxDate: moment().add(3, 'weeks').toDate(),
    onChange: selectedDates => {
      selectedDay = moment(selectedDates[0]).set(midnightReset)
    }
  })

  const fc = $('#calendar').fullCalendar({
    customButtons: {
      addEvent: {
        text: 'Ajouter une réservation',
        click: () => $('#edit-form').toggleClass('is-active')
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
    selectable: true,
    select: selectSlot,
    selectConstraint: 'businessHours',
    selectHelper: true,
    allDaySlot: false,
    slotDuration: '01:00',
    minTime: '10:00',
    maxTime: '22:00',
    defaultView: 'agendaWeek',
    validRange: currentDate => ({
      start: currentDate.clone().subtract(1, 'days'),
      end: currentDate.clone().add(3, 'weeks')
    }),
    height: 380,
    titleFormat: 'D MMMM YYYY',
    columnFormat: 'ddd D/M ',
    eventSources: [
      {
        id: 'room-events',
        events: (start, end, timezone, callback) => getEvents(start, end, currentRoom, callback),
        color: 'green'
      },
      {
        id: 'ja-events',
        events: (start, end, timezone, callback) => getEvents(start, end, 'ja-events', callback),
        color: 'red'
      }
    ]
  })

  function selectSlot (start, end) {
    $('#edit-form').toggleClass('is-active')
    selectedDay = start.clone().set(midnightReset)
    dayPicker.setDate(selectedDay.toDate())
    $('#start').val(start.hour())
    $('#end').val(end.hour())
  }

  function getEvents (start, end, room, callback) {
      // TODO: add some sort of caching ?
    return $.ajax({
      url: apiUrl + room,
      dataType: 'json',
      data: {
        start: start.unix(),
        end: end.unix()
      },
      success: callback
    })
  }

  $('.close-modal').click(() => {
    $('#edit-form').toggleClass('is-active')
    $('.input, .select, .textarea').val('')
    $('.modal-card-body').scrollTop(0) // TODO: this does not work => fix later
  })

  $('.room').click(e => {
    var room = e.currentTarget.dataset.room
    if (room !== currentRoom) {
      fc.fullCalendar('removeEvents', event => event.source.id === 'room-events')
      $('.room[data-room="' + currentRoom + '"').toggleClass('is-active')
      currentRoom = room
      $('.room[data-room="' + currentRoom + '"').toggleClass('is-active')
      fc.fullCalendar('refetchEventSources', 'room-events')
    }
  })

  function validateEvent (event) {
    let isValid = true

    if (!event.title) {
      isValid = false
      addMessage('il faut un titre pour ta réservation')
    }
    if (!event.tel) {
      isValid = false
      addMessage('on a besoin de ton téléphone pour te contacter')
    } else if (!event.tel.match(/^[+0-9]{10,13}$/)) {
      isValid = false
      addMessage('ca ressemble pas a un numéro de tel ca...')
    }
    if (event.start.isAfter(event.start)) {
      isValid = false
      addMessage('début avant le fin ?')
    }
    // if (!isValid) return false

    fc.fullCalendar('clientEvents').forEach(e => {
      if (e.id !== event.id &&
          (e.start.isBefore(event.end)) &&
          (event.start.isBefore(e.end))
        ) { // (StartA <= EndB) and (EndA >= StartB)
        isValid = false
        if (e.source.id === 'room-events') addMessage('ta répet chevauche celle de ' + event.title)
        else addMessage('l\'evenement "' + e.title + '" est programmé en meme temps que ta répet, merci de voir avec un.e permanent.e si cela ne va pas poser de souci')
      }
    })

    return isValid
  }

  function addMessage (message) {
    console.warn(message)
    // TODO: inject message node into message area
  }

  $('#submit').click(() => {
    // TODO: clear messages

    editedEvent.title = $('#title').val()
    editedEvent.tel = $('#tel').val() // TODO: trim '. ()'
    editedEvent.start = selectedDay.clone().hour($('#start').val())
    editedEvent.end = selectedDay.clone().hour($('#end').val())

    let doSubmit = validateEvent(editedEvent)

    if (doSubmit) {
      // TODO: ajax call
      console.log('submitting event :')
    }
  })
})
