/* global $, flatpickr, moment */
$(document).ready(function () {
  // CONFIG
  const apiUrl = 'http://localhost:8080/'
  // const apiUrl = 'http://demo6943786.mockable.io/'
  const hourPrice = 2.5 // €
  const openingHours = [
    {
      dow: [ 1, 2, 3, 4, 5, 6 ],
      start: '10:00',
      end: '22:00'
    },
    {
      dow: [ 0 ],
      start: '14:00',
      end: '20:00'
    }
  ]
  const godCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]

  // INIT VALUES
  let isInGodMode = false
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
  let godSeqCount = 0

  // EVENT HANDLERS
  const onAddEventClick = () => $('#edit-event').toggleClass('is-active')

  const onEventClick = event => {
    editedEvent.id = event.id
    $('#password-check').toggleClass('is-active')
  }

  const onSelectSlot = (start, end) => {
    $('#edit-event').toggleClass('is-active')
    selectedDay = start.clone().set(midnightReset)
    dayPicker.setDate(selectedDay.toDate())
    $('#start').val(start.hour())
    $('#end').val(end.hour())
  }

  const onTryPasswordClick = e => {
    let event = calendar.fullCalendar('clientEvents', editedEvent.id)[0]
    $('#edit-event .help').remove()
    $('#edit-event .is-danger').removeClass('is-danger')

    if ($('#password').val() === event.password || isInGodMode) {
      editedEvent.id = event.id
      $('#title').val(event.title)
      $('#tel').val(event.tel)
      $('#start').val(event.start.hour())
      $('#end').val(event.end.hour())
      $('#password-check').toggleClass('is-active')
      $('#edit-event').toggleClass('is-active')
      selectedDay = event.start.clone().set(midnightReset)
      dayPicker.setDate(selectedDay.toDate())
    } else {
      invalidField('#password', 'mot de passe oublié ?')
    }
  }

  const onModalClose = e => {
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
  }

  const onRoomClick = e => {
    let room = e.currentTarget.dataset.room
    if (room !== currentRoom) {
      calendar.fullCalendar('removeEvents', event => event.source.id === 'room-events')
      $('.room[data-room="' + currentRoom + '"').toggleClass('is-active')
      currentRoom = room
      $('.room[data-room="' + currentRoom + '"').toggleClass('is-active')
      calendar.fullCalendar('refetchEventSources', 'room-events')
    }
  }

  const onEventSubmit = () => {
    resetValidation()
    editedEvent.title = $('#title').val()
    editedEvent.tel = $('#tel').val() // TODO: trim '. ()'
    editedEvent.start = selectedDay.clone().hour($('#start').val())
    editedEvent.end = selectedDay.clone().hour($('#end').val())

    let doSubmit = validateEvent(editedEvent)

    if (doSubmit || isInGodMode) {
      $.ajax(apiUrl + currentRoom, {
        // contentType: 'application/json',
        dataType: 'json',
        crossDomain: true,
        method: editedEvent.id ? 'PUT' : 'POST',
        data: formatEvent(editedEvent)
      })
      .done(data => {
        let eventPrice = editedEvent.end.diff(editedEvent.start, 'hours') * hourPrice
        $('#edit-event').toggleClass('is-active')
        resetEditForm()
        showSuccess('Ta réservation a été ajoutée, n\'oublie pas de mettre ' + eventPrice + '€, ou plus si le coeur t\'en dis, dans la caisse à l\'étage.<br>Merci et bonne répet !')
        // TODO: set right message for update event
      })
      .fail(data => {
        showError('Oops, un truc ne marche pas.')
        console.warn('data :', data)
      })
    }
  }

  const onKeyDown = e => {
    let key = e.keyCode
    if (key === 27 && isInGodMode) toggleGodMode()

    if (!godSeqCount && key === godCode[0]) {
      godSeqCount++
    } else if (godSeqCount > 0) {
      if (godCode[godSeqCount] === key) godSeqCount++
      else godSeqCount = 0

      if (godSeqCount === godCode.length) {
        toggleGodMode()
        godSeqCount = 0
      }
    } else {
      godSeqCount = 0
    }
  }

  // DOM events bindings
  $('#try-password').click(onTryPasswordClick)
  $('.close-modal').click(onModalClose)
  $('.room').click(onRoomClick)
  $('#submit').click(onEventSubmit)
  $(document).keydown(onKeyDown)

  // INIT page components
  $('.room[data-room="' + currentRoom + '"').toggleClass('is-active')
  $('html').toggleClass('is-in-god-mode', isInGodMode)

  flatpickr.localize(flatpickr.l10ns.fr)

  const dayPicker = $('#day').flatpickr({
    dateFormat: 'l d F Y',
    minDate: moment().set(midnightReset).toDate(),
    maxDate: moment().add(3, 'weeks').toDate(),
    onChange: selectedDates => {
      selectedDay = moment(selectedDates[0]).set(midnightReset)
    }
  })

  const calendar = $('#calendar').fullCalendar({
    customButtons: {
      addEvent: {
        text: 'Ajouter une réservation',
        click: onAddEventClick
      }
    },
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'addEvent'
    },
    businessHours: openingHours,
    selectable: true,
    select: onSelectSlot,
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
    eventClick: onEventClick,
    eventSources: [
      {
        id: 'room-events',
        events: (start, end, timezone, callback) => getEvents(start, end, currentRoom, callback),
        color: 'green'
      },
      {
        id: 'ja-events',
        events: (start, end, timezone, callback) => getEvents(start, end, 'ja-events', callback),
        color: 'red',
        rendering: 'background'
      }
    ]
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
      invalidField('#start', 'Début avant la fin ?')
      invalidField('#end', 'Fin après début ?')
    }
    if (event.start.day() === 0) {
      if (event.start.hour() < 14) {
        isValid = false
        invalidField('#start', 'Le Jardin d\'alice ouvre a 14h le dimanche')
      }
      if (event.end.hour() > 20) {
        isValid = false
        invalidField('#end', 'Le Jardin d\'alice ferme a 20h le dimanche')
      }
    }

    calendar.fullCalendar('clientEvents').forEach(e => {
      if (e.id !== event.id &&
        (e.start.isBefore(event.end)) &&
        (event.start.isBefore(e.end))
      ) { // (StartA <= EndB) and (EndA >= StartB)
        isValid = false
        if (e.source.id === 'room-events') {
          addWarning('Ta répet chevauche celle de <i>"' + e.title + '"</i> prevue de ' + e.start.hour() + 'h a ' + e.end.hour() + 'h')
        } else if (e.source.id === 'ja-events') {
          addWarning('L\'évènement <i>"' + e.title + '"</i> est programmé en même temps que ta répet, vois avec quelq\'un d\'ici si ca ne va pas poser de souci, merci.')
        }
      }
    })

    return isValid
  }

  function formatEvent (event) {
    let e = $.extend(true, {}, event)
    e.start = e.start.toISOString()
    e.end = e.end.toISOString()
    return JSON.stringify(e)
  }

  function getEvents (start, end, room, callback) {
    // TODO: add some sort of caching ?
    return $.get(apiUrl + room, {start: start.unix(), end: end.unix()}, 'json')
    .done(callback)
    .fail((jqXHR, textStatus, errorThrown) => {
      showError('Oops une erreur"' + jqXHR.status + textStatus + '"vient d\'arriver en récupereant les evenements.', errorThrown)
    })
    .always(() => {
      // TODO: stop loading ?
    })
  }

  function resetEditForm () {
    $('.input, .select').val('')
    // TODO: improve efficiency ?

    editedEvent = {
      id: null,
      title: null,
      start: null,
      end: null,
      tel: null,
      password: null
    }
    resetValidation()
  }

  function resetPasswordForm () {
    $('#password').val('')
  }

  function resetValidation () {
    $('#edit-event .message .message').remove()
    $('#edit-event .help').remove()
    $('#edit-event .is-danger').removeClass('is-danger')
  }

  function afterSuccessOrError () {
    $('#success-error .is-danger').removeClass('is-danger')
    $('#success-error .is-success').removeClass('is-success')
    calendar.fullCalendar('gotoDate', moment())
  }

  function showError (text, data) {
    if ($('#success-error').hasClass('is-active')) console.error('Et une autre erreur aussi :')
    else $('#success-error').toggleClass('is-active')
    $('#success-error .message').addClass('is-danger')
    $('#success-error .button').addClass('is-danger')
    $('#success-error-text').html(text)
  }

  function showSuccess (text) {
    $('#success-error').toggleClass('is-active')
    $('#success-error .message').addClass('is-success')
    $('#success-error .button').addClass('is-success')
    $('#success-error-text').html(text)
    resetEditForm()
    setTimeout(() => {
      $('#success-error').removeClass('is-active')
      afterSuccessOrError()
    }, 20000)
  }

  function invalidField (fieldId, message) {
    let fieldElem = $(fieldId)
    fieldElem.addClass('is-danger') // TODO: fix for <select> and multiple
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

  function toggleGodMode () {
    isInGodMode = !isInGodMode
    $('html').toggleClass('is-in-god-mode', isInGodMode)
    // TODO: show delete button
    // TODO: show god mode exit button
  }
})
