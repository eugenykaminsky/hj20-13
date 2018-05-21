'use strict'

const selectId = document.getElementById('acSelect'); // Выбор id самолёта
const btnSeatMap = document.getElementById('btnSeatMap'); // Кнопка отображения схемы
const btnSetFull = document.getElementById('btnSetFull'); // Кнопка обозначения всех мест в самолете занятыми
const btnSetEmpty = document.getElementById('btnSetEmpty'); // Кнопка обозначения всех мест в самолете свободными
const seatMapTitle = document.getElementById('seatMapTitle'); // Информация о выбранном самолете и количестве пассажиров
const seatMapDiv = document.getElementById('seatMapDiv'); // Схема мест в самолете
const totalPax = document.getElementById('totalPax'); // Общее количество занятых мест
const totalAdult = document.getElementById('totalAdult'); // Общее количество мест с полной стоимостью
const totalHalf = document.getElementById('totalHalf'); // Общее количество детских мест

btnSetFull.disabled = true;
btnSetEmpty.disabled = true;

function getPlaneData(value) {
  fetch(`https://neto-api.herokuapp.com/plane/${value}`)
    .then(response => {
      if (200 <= response.status && response.status < 300) {
        return response;
      }
      throw new Error(response.statusText);
    })
    .then(result => result.json())
    .then(data => {
      seatMapTitle.textContent = `${data.title} (${data.passengers} пассажиров)`;
      initBtnSeatMap(data);
    });
}

// Инициализация кнопки показа карты
function initBtnSeatMap(data) {
  btnSeatMap.addEventListener('click', (e) => {
    e.preventDefault();
    totalPax.textContent = totalAdult.textContent = totalHalf.textContent = 0;
    renderMap(data);
  });
}

// Создание карты
function renderMap(data) {
  btnSetFull.disabled = false;
  btnSetEmpty.disabled = false;

  while (seatMapDiv.firstChild) {
    seatMapDiv.removeChild(seatMapDiv.firstChild);
  }

  data.scheme.forEach((item, i) => {
    const letters = item === 4 ? [].concat('', data.letters4, '') : ((item === 6) ? data.letters6 : []);
    const row = elRender('div', {class: 'row seating-row text-center'}, [
      elRender('div', {class: 'col-xs-1 row-number'}, [
        elRender('h2', null, `${i + 1}`)
      ])
    ]);
    const colLeft = elRender('div', {class: 'col-xs-5'});
    const colRight = elRender('div', {class: 'col-xs-5'});

    letters.forEach((letter, i) => {
      if (i <= 2) {
        colLeft.appendChild(renderSeat(letter));
      } else {
        colRight.appendChild(renderSeat(letter));
      }
    });

    row.appendChild(colLeft);
    row.appendChild(colRight);

    seatMapDiv.appendChild(row);
  });
}

// Добавления места с буквой или пустое место
function renderSeat(value) {
  if (value !== '') {
    const seat = elRender('div', {class: 'col-xs-4 seat'}, [
      elRender('span', {class: 'seat-label'}, value)
    ]);

    seat.addEventListener('click', checkedSingleSeat);

    return seat;
  } else {
    return elRender('div', {class: 'col-xs-4 no-seat'});
  }
}

// Подсчет количества занятых мест
function countCheckedSeat() {
  const seats = seatMapDiv.querySelectorAll('.seat');

  Array.from(seats).forEach(item => {
    if (item.classList.contains('adult') || item.classList.contains('half')) {
      totalPax.textContent = (parseInt(totalPax.textContent) < seats.length) ? parseInt(totalPax.textContent) + 1 : seats.length;
    } else {
      totalPax.textContent = (parseInt(totalPax.textContent) > 0) ? parseInt(totalPax.textContent) - 1 : 0;
    }

    if (item.classList.contains('adult')) {
      totalAdult.textContent = (parseInt(totalAdult.textContent) < seats.length) ? parseInt(totalAdult.textContent) + 1 : seats.length;
    } else {
      totalAdult.textContent = (parseInt(totalAdult.textContent) > 0) ? parseInt(totalAdult.textContent) - 1 : 0;
    }

    if (item.classList.contains('half')) {
      totalHalf.textContent = (parseInt(totalHalf.textContent) < seats.length) ? parseInt(totalHalf.textContent) + 1 : seats.length;
    } else {
      totalHalf.textContent = (parseInt(totalHalf.textContent) > 0) ? parseInt(totalHalf.textContent) - 1 : 0;
    }
  });
}

// Выделить или снятие выделение со всех мест
function checkedAllSeat(type) {
  const seatList = seatMapDiv.querySelectorAll('.seat');

  Array.from(seatList).forEach(item => {
    if (!item.classList.contains('adult') && type === 'add') {
      item.classList.add('adult');
    } else if ((item.classList.contains('adult') || item.classList.contains('half')) && type === 'remove') {
      item.classList.remove('adult', 'half');
    }
  });

  countCheckedSeat();
}

// Выбрать одно место
function checkedSingleSeat(event) {
  const target = event.currentTarget;

  if (!target.classList.contains('adult')) {
    target.classList.add('adult');
    totalPax.textContent = parseInt(totalPax.textContent) + 1;
    totalAdult.textContent = parseInt(totalAdult.textContent) + 1;
  } else {
    target.classList.remove('adult');
    totalPax.textContent = parseInt(totalPax.textContent) - 1;
    totalAdult.textContent = parseInt(totalAdult.textContent) - 1;
  }

  if (!target.classList.contains('half') && event.altKey) {
    target.classList.add('half');
    totalPax.textContent = parseInt(totalPax.textContent) + 1;
    totalHalf.textContent = parseInt(totalHalf.textContent) + 1;
  } else if (target.classList.contains('half') && event.altKey) {
    target.classList.remove('half');
    totalPax.textContent = parseInt(totalPax.textContent) - 1;
    totalHalf.textContent = parseInt(totalHalf.textContent) - 1;
  }
}

// Создание элемента с атрибутами и содержимым
function elRender(tagName, attrs, childs) {
  const el = document.createElement(tagName);

  if (typeof attrs === 'object' && attrs !== null) {
    Object.keys(attrs).forEach(attr => el.setAttribute(attr, attrs[attr]));
  }

  if (typeof childs === 'string') {
    el.textContent = childs;
  } else if (childs instanceof Array) {
    childs.forEach(child => el.appendChild(child));
  }

  return el;
}

selectId.addEventListener('change', event => getPlaneData(event.target.value));

document.addEventListener('DOMContetLoaded', getPlaneData(selectId.value));

btnSetFull.addEventListener('click', (e) => {
  e.preventDefault();
  checkedAllSeat('add');
});

btnSetEmpty.addEventListener('click', (e) => {
  e.preventDefault();
  checkedAllSeat('remove');
});
