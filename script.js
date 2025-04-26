'use strict';

// Selezione elementi DOM
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// CLASSI
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
        ];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
        months[this.date.getMonth()]
        } ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
    }
    }

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}

// APP
class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    #markers = [];

    constructor() {
        this._getPosition();
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField.bind(this));

        // Event Delegation su tutto il container workouts
        containerWorkouts.addEventListener('click', this._handleWorkoutActions.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(
            this._loadMap.bind(this),
            function () {
            alert('Non riesco ad ottenere la tua posizione');
            }
        );
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work => {
        this._renderWorkoutMarker(work);
        });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();

        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        if (type === 'running') {
        const cadence = +inputCadence.value;
        if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence))
            return alert('Input deve essere un numero positivo');

        workout = new Running([lat, lng], distance, duration, cadence);
        }

        if (type === 'cycling') {
        const elevation = +inputElevation.value;
        if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration))
            return alert('Input deve essere un numero positivo');

        workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        this.#workouts.push(workout);

        this._renderWorkoutMarker(workout);
        this._renderWorkout(workout);
        this._hideForm();
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout) {
        const marker = L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(
            L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
            })
        )
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();

        this.#markers.push({ marker, id: workout.id });
    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
            </div>`;

        if (workout.type === 'running')
        html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
            </div>`;

        if (workout.type === 'cycling')
        html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
            </div>`;

        html += `
            <div class="workout__actions">
            <button class="workout__btn workout__btn--delete">🗑️ Delete</button>
            </div>
        </li>`;

        containerWorkouts.insertAdjacentHTML('beforeend', html);
    }

    _moveToMarker(workoutId) {
        const workoutMarker = this.#markers.find(marker => marker.id === workoutId);
        if (workoutMarker)
        this.#map.setView(workoutMarker.marker.getLatLng(), this.#mapZoomLevel, { animate: true });
    }

    _deleteWorkout(workoutId) {
        this.#workouts = this.#workouts.filter(workout => workout.id !== workoutId);

        const workoutEl = document.querySelector(`[data-id="${workoutId}"]`);
        if (workoutEl) workoutEl.remove();

        const workoutMarker = this.#markers.find(marker => marker.id === workoutId);
        if (workoutMarker) {
        this.#map.removeLayer(workoutMarker.marker);
        this.#markers = this.#markers.filter(marker => marker.id !== workoutId);
        }

        this._setLocalStorage();
    }

    _handleWorkoutActions(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;

        const workoutId = workoutEl.dataset.id;

        if (e.target.classList.contains('workout__btn--delete')) {
        this._deleteWorkout(workoutId);
        } else {
        this._moveToMarker(workoutId);
        }
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;

        this.#workouts = data.map(work => {
        if (work.type === 'running') {
            const run = new Running(work.coords, work.distance, work.duration, work.cadence);
            run.id = work.id;
            run.date = new Date(work.date);
            return run;
        }
        if (work.type === 'cycling') {
            const cycle = new Cycling(work.coords, work.distance, work.duration, work.elevationGain);
            cycle.id = work.id;
            cycle.date = new Date(work.date);
            return cycle;
        }
        });

        this.#workouts.forEach(workout => {
        this._renderWorkout(workout);
        });
    }
}

const app = new App();
