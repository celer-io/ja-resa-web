/* global $, flatpickr, moment */
$(document).ready(function () {
  // CONFIG
  const apiUrl = 'http://localhost:8080/'
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

  // INIT VALUES
  const midnightReset = {
    'hour': 0,
    'minute': 0,
    'second': 0,
    'milisecond': 0
  }
  let currentRoom = 'music'
  let selectedDay = moment().set(midnightReset)
  let isInGodMode = true // default to false
  let editedEvent = {
    id: null,
    title: null,
    start: null,
    end: null,
    tel: null,
    password: null
  }

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
    // $('#edit-event .help').remove()
    // $('#edit-event .is-danger').removeClass('is-danger')
    // event.password = 'toto' // TODO : remve dummy password, or set stronger if not present
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
      invalidField('#password', 'mot de passe oublie ?')
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
      $.post(apiUrl + currentRoom, formatEvent(editedEvent))
        .done(data => {
          let eventPrice = editedEvent.end.diff(editedEvent.start, 'hours') * hourPrice
          $('#edit-event').toggleClass('is-active')
          resetEditForm()
          openSuccessError('Ta reservation a ete ajoutee, n\'oublie pas de mettre ' + eventPrice + '€, ou plus si le coeur t\'en dis, dans la caisse a l\'etage.<br>Merci et bonne repet !', 'success')
        })
        .fail(data => {
          openSuccessError('Oops, un truc ne marche pas.', 'danger')
          console.warn('data :', data)
        })
    }
  }

  // DOM events bindings
  $('#try-password').click(onTryPasswordClick)
  $('.close-modal').click(onModalClose)
  $('.room').click(onRoomClick)
  $('#submit').click(onEventSubmit)

  // INIT page components
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
      invalidField('#start, #end', 'Huh, tu est sur.e de l\'horaire ?')
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
          addWarning('L\'evenement <i>"' + e.title + '"</i> est programmé en meme temps que ta répet, merci de voir avec un.e permanent.e si cela ne va pas poser de souci')
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
    return $.ajax({
      url: apiUrl + room,
      dataType: 'json',
      data: {
        start: start.unix(),
        end: end.unix()
      },
      success: callback,
      error: (jqXHR, textStatus, errorThrown) => {
        openSuccessError('Oopsie.', 'danger')
        console.log('error')
        console.log('textStatus :', textStatus)
        console.log('errorThrown :', errorThrown)
      }
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
    calendar.fullCalendar('gotoDate', moment())
  }

  function openSuccessError (text, color) {
    color = color || 'success'
    $('#success-error').toggleClass('is-active')
    $('#success-error-text').html(text)
    // TODO: set modal success/error style
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

  window.addEventListener('mousemove', function (e) {
    var toAppend = document.getElementsByClassName('loader-container')[0]
    var all = document.getElementsByClassName('loader-container')
    console.log('all :', all)

    var parentDiv = document.createElement('div')
    parentDiv.className = 'loader-container'
    var innerDiv = document.createElement('div')
    innerDiv.className = 'loader-truc'
    parentDiv.appendChild(innerDiv)
    var d = document.body.appendChild(parentDiv)
    console.log('d :', d)

    parentDiv.style.left = (e.clientX - 50) + 'px'
    parentDiv.style.top = (e.clientY - 50) + 'px'

    if (document.getElementsByClassName('loader-container').length > 50) {
      document.body.removeChild(toAppend)
    }
  })
})
