const noOfFloors = document.getElementById("no-of-floors");
const noOfLifts = document.getElementById("no-of-lifts");
const submitButton = document.getElementById("submit")
const body = document.querySelector("body");
const mainArea = document.querySelector("#main-area");
const form = document.querySelector(".form");

submitButton.addEventListener('click', (e) => {
    e.preventDefault()
    const numberOfFloors = Number(noOfFloors.value);
    const numberOfLifts = Number(noOfLifts.value);

    if (!numberOfFloors || !numberOfLifts) {
        alert("Please Enter Valid no of Floors and Lifts");
    }
    createScenario(numberOfLifts, numberOfFloors);
    form.style.display = "none";
})

let liftState = [];
let floors = [];
let pending = [];

const createScenario = (liftCount, floorCount) => {
    createFloors(floorCount,liftCount);
    createLifts(liftCount)
};

const createFloors = (floorCount,liftCount) => {
    const viewportWidth = window.innerWidth;

    const requiredWidth = 70 * liftCount + 80;

    for (let i = 0; i < floorCount; i++) {
        const floor = document.createElement("div");
        floor.classList.add("floor");
        floor.id = `floor${floorCount - i - 1}`;

        floor.style.width=viewportWidth>requiredWidth?`${viewportWidth}px`:`${requiredWidth}px`;

        const upButton = document.createElement("button");
        upButton.innerText = "UP";
        upButton.classList.add("UP");
        upButton.id = `up${floorCount - i - 1}`
        upButton.addEventListener("click", buttonClickHander);

        const downButton = document.createElement("button");
        downButton.classList.add("DN");
        downButton.addEventListener('click', buttonClickHander)
        downButton.id = `dn${floorCount - i - 1}`;
        downButton.innerText = 'DN';

        const floorNumber = document.createElement("span");
        floorNumber.classList.add("floor-number");
        floorNumber.innerText = "Floor " + String((floorCount - i - 1));

        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("buttons-box");
        buttonsContainer.appendChild(upButton);
        buttonsContainer.appendChild(floorNumber);
        buttonsContainer.appendChild(downButton);
        floor.appendChild(buttonsContainer);

        mainArea.appendChild(floor);

        floors.push(floor);
    }
};

const createLifts = (liftCount) => {
    for (let i = 0; i < liftCount; i++) {
        const floor0 = document.querySelector("#floor0");
        const lift = document.createElement("div");
        lift.classList.add('lift')

        lift.id = `lift${i}`;
        lift.style.left = `${100+i*100}px`
        const currLiftState = {
            id: i,
            currentFloor: 0,
            domElement: lift,
            innerHtML: ``,
            isMoving: false,
            isBusy: false,
            movingTo: null,
        }
        floor0.appendChild(lift);
        liftState.push(currLiftState)
    }

    setInterval(() => {
        scheduleLiftMovement();
    }, 1)
};

const buttonClickHander = (event) => {
    const floorNumberCalled = Number(event.target.id.substring(2));
    const isLiftAlreadyPresentAtFloor = liftState.find(lift => lift.currentFloor === floorNumberCalled)
    if (isLiftAlreadyPresentAtFloor) {
        return;
    }
    pending.push(floorNumberCalled)
};

const moveLiftFromSourceToDestination = (src, dest, liftId) => {
    const lift = liftState.find(lift => lift.id === liftId);

    const distance = -1 * (dest) * 120;
    const time = Math.abs(src - dest);
    setTimeout(() => {
        lift.currentFloor = dest;
        lift.isMoving = false;
        lift.isBusy = false;
        lift.movingTo = null;
    }, time * 500)

    lift.isBusy = true;
    lift.isMoving = true;
    lift.movingTo = dest;
    lift.domElement.style.transform = `translateY(${distance}px)`;
    lift.domElement.style.transition = `transform ${time}s`
};

const findNearestlift = (liftState, destinationFloor) => {
    let distance = floors.length;
    let liftId = 0;
    for (let i = 0; i < liftState.length; i++) {
        const lift = liftState[i];
        if (Math.abs(lift.currentFloor - destinationFloor) < distance && lift.isBusy === false) {
            distance = Math.abs(lift.currentFloor - destinationFloor);
            liftId = lift.id;
        }
    }
    return liftId;
};

const scheduleLiftMovement = () => {
    if (pending.length === 0) return;
    const floor = pending.shift();
    const nearestliftId = findNearestlift(liftState, floor);
    const nearestLift = liftState.find(lift => lift.id === nearestliftId);

    if (!nearestLift) {
        pending.unshift(floor);
        return;
    }
    moveLiftFromSourceToDestination(nearestLift.currentFloor, floor, nearestliftId);
};