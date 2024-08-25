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

    if ((!numberOfFloors || !numberOfLifts) || (numberOfFloors<0 || numberOfLifts<0)) {
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
        if(i>0) buttonsContainer.appendChild(upButton);
        buttonsContainer.appendChild(floorNumber);
        if(i<floorCount-1) buttonsContainer.appendChild(downButton);
        floor.appendChild(buttonsContainer);

        mainArea.appendChild(floor);

        floors.push(floor);
    }
};

const createLifts = (liftCount) => {
    for (let i = 0; i < liftCount; i++) {
        const floor0 = document.querySelector("#floor0");
        const lift = document.createElement("div");
        const leftDoor = document.createElement("div");
        const rightDoor = document.createElement("div");

        leftDoor.classList.add("door");
        rightDoor.classList.add("door");
        leftDoor.classList.add("left-door");
        rightDoor.classList.add("right-door");

        leftDoor.id = `left-door${i}`;
        rightDoor.id = `right-door${i}`;

        lift.appendChild(leftDoor);
        lift.appendChild(rightDoor);
        lift.classList.add('lift')

        lift.id = `lift${i}`;
        lift.style.left = `${100+i*100}px`;
        const currLiftState = {
            id: i,
            currentFloor: 0,
            domElement: lift,
            innerHtML: ``,
            isMoving: false,
            direction: "up",
            isBusy: false,
            movingTo: null,
        };
        floor0.appendChild(lift);
        liftState.push(currLiftState);
    }

    setInterval(() => {
        scheduleLiftMovement();
    }, 10);
};

const buttonClickHander = (event) => {
    const floorNumberCalled = Number(event.target.id.substring(2));
    const direction = event.target.id.substring(0,2) === "dn" ? "dn" : "up";
    const isLiftComing = liftState.find(lift => lift.currentFloor === floorNumberCalled && lift.isMoving === true);
    if (isLiftComing) {
        return;
    }
    pending.push(floorNumberCalled)
};

function startLiftMovement(lift, dest, time, leftDoor, rightDoor) {
    //Open Doors on Reaching Floor
    setTimeout(() => {
        //console.log("Set Timeout 1 called!");
        leftDoor.style.transform = `translateX(-100%)`;
        leftDoor.style.transition = `transform 2.5s linear`;
        rightDoor.style.transform = `translateX(100%)`
        rightDoor.style.transition = `transform 2.5s linear`
        lift.currentFloor = dest;
        lift.isMoving = false;
        lift.movingTo = null;
    }, time * 1000);

    lift.isBusy = true;

    //Close doors
    setTimeout(() => {
        //console.log("Set Timeout 2 called!");
        leftDoor.style.transform = `translateX(0)`;
        leftDoor.style.transition = `transform 2.5s linear`;
        rightDoor.style.transform = `translateX(0)`
        rightDoor.style.transition = `transform 2.5s linear`;
    }, time * 1000 + 2500);

    //After door closes, lift is no more busy
    setTimeout(() => {
        //console.log("Set Timeout 3 called!");
        lift.isBusy = false;
    }, time * 1000 + 5000);
}

const moveLiftFromSourceToDestination = (src, dest, liftId) => {
    const lift = liftState.find(lift => lift.id === liftId);

    const distance = -1 * (dest) * 120;
    const time = Math.abs(src - dest) * 2;
    const leftDoor = document.querySelector(`#left-door${liftId}`);
    const rightDoor = document.querySelector(`#right-door${liftId}`);
    
    startLiftMovement(lift, dest, time, leftDoor, rightDoor);

    lift.isMoving = true;
    lift.movingTo = dest;
    lift.domElement.style.transform = `translateY(${distance}px)`;
    lift.domElement.style.transition = `transform ${time}s linear`;
};

const findNearestlift = (liftState, destinationFloor) => {
    let distance = floors.length;
    let liftId = 0;
    for (let i = 0; i < liftState.length; i++) {
        const lift = liftState[i];
        if (Math.abs(lift.currentFloor - destinationFloor) < distance && lift.isBusy === false ) {
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