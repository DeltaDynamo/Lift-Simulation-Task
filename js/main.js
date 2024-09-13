const noOfFloors = document.getElementById("no-of-floors");
const noOfLifts = document.getElementById("no-of-lifts");
const submitButton = document.getElementById("submitButton");
const body = document.querySelector("body");
const mainArea = document.querySelector("#main-area");
const form = document.querySelector(".form");

function validateInput(event) {
    if (!/^[0-9]$/.test(event.key)) {
        event.preventDefault();
    }
}

noOfFloors.addEventListener("keypress", validateInput);
noOfLifts.addEventListener("keypress", validateInput);

[noOfFloors, noOfLifts].forEach((input) => {
    input.addEventListener("paste", (event) => {
        const paste = (event.clipboardData || window.clipboardData).getData(
        "text"
        );
        if (!/^\d+$/.test(paste)) {
        event.preventDefault();
    }
});
});

submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    const numberOfFloors = Number(noOfFloors.value);
    const numberOfLifts = Number(noOfLifts.value);

    if ((!numberOfFloors || !numberOfLifts) || (numberOfFloors<=0 || numberOfLifts<=0)) {
        alert("Please Enter Valid no of Floors i.e., more than 0 and No. of Lifts should be more than 0");
        return;
    }
    createScenario(numberOfLifts, numberOfFloors);
    form.style.display = "none";
})

let liftState = [];
let floors = [];
let pendingAction = [];

const createScenario = (liftCount, floorCount) => {
    createFloors(floorCount,liftCount);
    createLifts(liftCount)
};

const createFloors = (floorCount,liftCount) => {
    const viewportWidth = window.innerWidth;

    const requiredWidth = 100 * liftCount + 80;

    for (let i = 0; i < floorCount; i++) {
        const floor = document.createElement("div");
        floor.classList.add("floor");
        floor.id = `floor${floorCount - i - 1}`;

        floor.style.width=viewportWidth>requiredWidth?`${viewportWidth}px`:`${requiredWidth}px`;

        const upButton = document.createElement("button");
        upButton.innerText = "UP";
        upButton.classList.add("UP");
        upButton.id = `up${floorCount - i - 1}`
        upButton.addEventListener("click", buttonClickHandler);

        const downButton = document.createElement("button");
        downButton.classList.add("DN");
        downButton.addEventListener('click', buttonClickHandler)
        downButton.id = `dn${floorCount - i - 1}`;
        downButton.innerText = 'DN';

        const floorNumber = document.createElement("span");
        floorNumber.classList.add("floor-number");
        if(floorCount - i - 1 > 0) floorNumber.innerText = "Floor " + String((floorCount - i - 1));
        else floorNumber.innerText = "GND";

        const buttonsContainer = document.createElement("div");
        buttonsContainer.classList.add("buttons-box");

        if(floorCount === 1) {
            upButton.innerText = "〉 | 〈";
            buttonsContainer.appendChild(upButton);
        }

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
        leftDoor.innerHTML = `<span>L</span>`;
        rightDoor.innerHTML = `${i+1}`;

        const statusDot = document.createElement("div");
        statusDot.classList.add("status-dot");
        statusDot.id = `status-dot${i}`;
        leftDoor.appendChild(statusDot);


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
            lastButtonCalled: null,
            isBusy: false,
            goingTo: null,
            doorReopen: [],
        };
        floor0.appendChild(lift);
        liftState.push(currLiftState);
    }

    setInterval(() => {
        scheduleLiftMovement();
    }, 100);

    setInterval(() => {
        checkLiftStatus();
    }, 5);
};

function checkLiftStatus() {
    for(let i=0;i<liftState.length;i++){
        const lift = liftState[i];
        const statusDot = document.querySelector(`#status-dot${lift.id}`);
        if(lift.isBusy || lift.isMoving){
            //set status light to red
            statusDot.style.backgroundColor = "red";
        }
        else {
            //set status light to green
            statusDot.style.backgroundColor = "greenyellow";
        }
    }
};

const checkIfLiftComingToFloor = (liftState, destinationFloor, buttonCalled) => {
    const isLiftOnFloor = liftState.find(lift => lift.isMoving === false && lift.isBusy === true && lift.currentFloor === destinationFloor);

    if(isLiftOnFloor != undefined) {
        const lift = isLiftOnFloor;
        const leftDoor = document.querySelector(`#left-door${lift.id}`);
        const rightDoor = document.querySelector(`#right-door${lift.id}`);
        openCloseDoors(lift, leftDoor, rightDoor);
        return true;
    }

    const isLiftComingToThatFloor = liftState.find(lift => lift.isMoving === true && lift.goingTo === destinationFloor && lift.lastButtonCalled === buttonCalled);

    if(isLiftComingToThatFloor === undefined){
        return false;
    }
    return true;
}

const buttonClickHandler = (event) => {
    const floorNumberCalled = Number(event.target.id.substring(2));
    const buttonCalledFrom = event.target.id.substring(0,2) === "dn" ? "dn" : "up";
    if (checkIfLiftComingToFloor(liftState, floorNumberCalled, buttonCalledFrom)) {
        return;
    }
    pendingAction.push([floorNumberCalled, buttonCalledFrom]);
};

function openCloseDoors(lift, leftDoor, rightDoor) {
    lift.doorReopen.push(1);

    if (lift.currentDoorTimeout) {
        clearTimeout(lift.currentDoorTimeout);
        leftDoor.style.transition = 'transform 2.5s linear';
        rightDoor.style.transition = 'transform 2.5s linear';
        leftDoor.style.transform = 'translateX(-100%)';
        rightDoor.style.transform = 'translateX(100%)';
    } else {
        // Initial door open sequence
        setTimeout(() => {
            leftDoor.style.transform = `translateX(-100%)`;
            leftDoor.style.transition = `transform 2.5s linear`;
            rightDoor.style.transform = `translateX(100%)`;
            rightDoor.style.transition = `transform 2.5s linear`;
        }, 0);
    }

    lift.isBusy = true;

    lift.currentDoorTimeout = setTimeout(() => {
        leftDoor.style.transform = `translateX(0)`;
        rightDoor.style.transform = `translateX(0)`;
    }, 2500);

    setTimeout(() => {
        lift.doorReopen.pop();
        if (lift.doorReopen.length === 0) {
            lift.isBusy = false;
            lift.currentDoorTimeout = null;
        }
    }, 5000);
}


function doorMovement(lift, dest, time, leftDoor, rightDoor) {
    //Open Doors on Reaching Floor, lift is now busy
    setTimeout(() => {
        //console.log("Set Timeout 1 called!");
        lift.isBusy = true;
        leftDoor.style.transform = `translateX(-100%)`;
        leftDoor.style.transition = `transform 2.5s linear`;
        rightDoor.style.transform = `translateX(100%)`;
        rightDoor.style.transition = `transform 2.5s linear`;
    }, time * 1000);

    setTimeout(() => {
        lift.isMoving = false;
        lift.currentFloor = dest;
        lift.goingTo = null;
    }, (time * 1000) + 1);

    //Close doors
    setTimeout(() => {
        //console.log("Set Timeout 2 called!");
        leftDoor.style.transform = `translateX(0)`;
        leftDoor.style.transition = `transform 2.5s linear`;
        rightDoor.style.transform = `translateX(0)`
        rightDoor.style.transition = `transform 2.5s linear`;
    }, time * 1000 + 2500);

    //After door closes, lift is no more busy, if someone has not clicked buttons to reopen door
    setTimeout(() => {
        //console.log("Set Timeout 3 called!");
        if(lift.doorReopen.length === 0) lift.isBusy = false;
    }, time * 1000 + 5001);
}

const moveLiftFromSourceToDestination = (src, dest, buttonCalled, liftId) => {
    const lift = liftState.find(lift => lift.id === liftId);

    let distance = -1 * (dest) * 120.8;
    if(window.innerWidth < 900) distance = -1 * (dest) * 100.8;
    const time = Math.abs(src - dest) * 2;
    const leftDoor = document.querySelector(`#left-door${liftId}`);
    const rightDoor = document.querySelector(`#right-door${liftId}`);
    
    doorMovement(lift, dest, time, leftDoor, rightDoor);

    lift.isMoving = true;
    lift.goingTo = dest;
    lift.lastButtonCalled = buttonCalled;
    lift.domElement.style.transform = `translateY(${distance}px)`;
    lift.domElement.style.transition = `transform ${time}s linear`;
};

const findClosestLift = (liftState, destinationFloor, buttonCalled) => {
    let distance = floors.length;
    let liftId = null;
    for (let i = 0; i < liftState.length; i++) {
        const lift = liftState[i];
        if (Math.abs(lift.currentFloor - destinationFloor) < distance && lift.isMoving === false && lift.isBusy === false ) {
            distance = Math.abs(lift.currentFloor - destinationFloor);
            liftId = lift.id;
        }
    }
    return liftId;
};

const scheduleLiftMovement = () => {
    if (pendingAction.length === 0) return;
    const firstActionPending = pendingAction.shift();

    const floorCalled = firstActionPending[0];
    const buttonCalled = firstActionPending[1];
    const closestLiftId = findClosestLift(liftState, floorCalled, buttonCalled);
    const closestLift = liftState.find(lift => lift.id === closestLiftId);

    if(checkIfLiftComingToFloor(liftState, floorCalled, buttonCalled)){
        return;
    }

    if (closestLift === undefined || closestLift.isBusy) {
        pendingAction.unshift(firstActionPending);
        return;
    }

    moveLiftFromSourceToDestination(closestLift.currentFloor, floorCalled, buttonCalled, closestLiftId);
};