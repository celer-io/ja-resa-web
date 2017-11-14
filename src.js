/* global $, flatpickr, moment */
$(document).ready(function () {
  // const apiUrl = 'http://demo6943786.mockable.io/'
  const apiUrl = 'http://localhost:8080/'
  const hourPrice = 2.5 // €

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
    tel: null,
    password: null
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
        click: () => $('#edit-event').toggleClass('is-active')
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
    slotEventOverlap: false,
    validRange: currentDate => ({
      start: currentDate.clone().set(midnightReset).subtract(1, 'hour'),
      end: currentDate.clone().set(midnightReset).hour(22).add(3, 'weeks')
    }),
    height: 380,
    titleFormat: 'D MMMM YYYY',
    columnFormat: 'ddd D/M ',
    eventClick: event => {
      if (event.source.id !== 'room-events') return
      console.log('event :', event)
      $('#password-check').toggleClass('is-active')
      // TODO: open modal
      // TODO: check password
      // TODO: fill edited event
      // TODO: fill form
    },
    eventSources: [
      {
        id: 'room-events',
        events: (start, end, timezone, callback) => getEvents(start, end, currentRoom, callback),
        color: 'green'
      },
      {
        id: 'ja-events',
        events: (start, end, timezone, callback) => getEvents(start, end, 'ja-events', callback),
        color: 'rgba(255, 0, 30, 0.5)'
      }
    ]
  })

  function selectSlot (start, end) {
    $('#edit-event').toggleClass('is-active')
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
      success: callback,
      error: (jqXHR, textStatus, errorThrown) => {
        console.log('error')
        console.log('jqXHR, textStatus, errorThrown :', jqXHR, textStatus, errorThrown)
      }
    })
  }

  $('.close-modal').click(e => {
    let modalEl = $(e.target).parents('.modal')
    modalEl.toggleClass('is-active')

    switch (modalEl.attr('id')) {
      case 'edit-event':
        resetEditForm()
        break
      case 'password-check':
        resetPasswordForm()
        break
      case 'success-error':
        afterSuccessOrError()
        break
    }
  })

  function resetEditForm () {
    $('.input, .select').val('')
    // TODO: improve efficiency ?
    resetValidation()
  }

  function resetPasswordForm () {
    $('#password-check .input').val('')
  }

  function resetValidation () {
    $('#edit-event .message .message').remove()
    $('#edit-event .help').remove()
    $('#edit-event .is-danger').removeClass('is-danger')
  }

  function afterSuccessOrError () {
    // TODO: reset fc to current week
    // TODO
  }

  $('.room').click(e => {
    let room = e.currentTarget.dataset.room
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
      invalidField('#title', 'Il faut un titre pour ta réservation')
    }
    if (!event.tel) {
      isValid = false
      invalidField('#tel', 'On a besoin de ton téléphone pour te contacter')
    } else if (!event.tel.match(/^[+0-9]{10,13}$/)) {
      isValid = false
      invalidField('#tel', 'Ca ressemble pas vraiment a un numéro de tel ca...')
    }
    if (event.start.isAfter(event.end) ||
        event.end.isBefore(moment())) {
      isValid = false
      console.log('event.start.isAfter(event.start) || event.end.isBefore(moment())')
      invalidField('#start, #end', 'Huh, tu est sur.e de l\'horaire ?')
    }
    if (event.start.day() === 0) {
      console.log('event.start.day() === 0')
      if (event.start.hour() < 14) {
        console.log('event.start.hour() < 14')
        isValid = false
        invalidField('#start', 'Le Jardin d\'alice ouvre a 14h le dimanche')
      }
      if (event.end.hour() > 20) {
        console.log('event.end.hour() > 20')
        isValid = false
        invalidField('#end', 'Le Jardin d\'alice ferme a 20h le dimanche')
      }
    }

    fc.fullCalendar('clientEvents').forEach(e => {
      if (e.id !== event.id &&
          (e.start.isBefore(event.end)) &&
          (event.start.isBefore(e.end))
        ) { // (StartA <= EndB) and (EndA >= StartB)
        isValid = false

        if (e.source.id === 'room-events') {
          addWarning('Ta répet chevauche celle de <i>"' + e.title + '"</i> prevue de ' + e.start.hour() + 'h a ' + e.end.hour() + 'h')
        } else {
          addWarning('L\'evenement <i>"' + e.title + '"</i> est programmé en meme temps que ta répet, merci de voir avec un.e permanent.e si cela ne va pas poser de souci')
        }
      }
    })

    return isValid
  }

  function openSuccessError (text, color) {
    color = color || 'success'
    $('#success-error').toggleClass('is-active')
    $('#success-error-text').html(text)
    // TODO: set modal success/error style
  }

  function invalidField (fieldId, message) {
    let fieldElem = $(fieldId)
    console.log('fieldElem :', fieldElem)
    fieldElem.addClass('is-danger')
    fieldElem.parents('.control').after('<p class="help">' + message + '</p>')
  }

  function addWarning (message) {
    let messageHtml =
    '<article class="message is-warning">' +
    '<div class="message-body">' +
    message +
    '</div>' +
    '</article>'
    $('#end').parents('.field').after(messageHtml)
  }

  function formatEvent (event) {
    let e = $.extend(true, {}, event)
    e.start = e.start.toISOString()
    e.end = e.end.toISOString()
    return JSON.stringify(e)
  }

  $('#submit').click(() => {
    resetValidation()
    editedEvent.title = $('#title').val()
    editedEvent.tel = $('#tel').val() // TODO: trim '. ()'
    editedEvent.start = selectedDay.clone().hour($('#start').val())
    editedEvent.end = selectedDay.clone().hour($('#end').val())

    let doSubmit = validateEvent(editedEvent)

    if (doSubmit) {
      $.post(apiUrl + currentRoom, formatEvent(editedEvent))
        .done(data => {
          let eventPrice = editedEvent.end.diff(editedEvent.start, 'hours') * hourPrice
          $('#edit-event').toggleClass('is-active')
          resetEditForm()
          openSuccessError('Ta reservation a ete ajoutee, n\'oublie pas de mettre ' + eventPrice + '€, ou plus si le coeur t\'en dis, dans la caisse a l\'etage.<br>Merci et bonne repet !')
        })
        .fail(data => {
          openSuccessError('Oops, ya un truc qui marche pas.')
          console.log('data :', data)
        })
    }
  })
})
