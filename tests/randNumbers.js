const testArray = () => {
    const arr = [
        {
            pos: 4,
            name: 'Hi',
        }, 
        {
            pos: 1,
            name: 'asd',
        },
        {
            pos: 3,
            name: 'gsdfg',
        },
        {
            pos: 2,
            name: '123',
        },
    ];

    console.log(arr.filter(element => element.pos < 4));
};

const testForLoop = () => {
    let num = 6;

    for ( let i = num; i > 0;) {
        const rand = Math.floor(Math.random() * 3) + 1;
        console.log('i before subtracted: ', i);
        console.log('rand is: ', rand);

        if (i === 1) {
            console.log('i is 1');
            return;
        }

        if (i - rand <= 0) {
            const oneLess = i - 1;
            i -= oneLess;
            console.log('i oneless: ', i);
            break;
        }

        i -= rand;
        console.log('i after subtracted ', i);
    }
};

const testWhile = () => {
    let num = 6;
    let toAdd = ['hi', 'yes'];

    const arr = [];

    const diceRoll = 2;

    while (arr.length < diceRoll) {
        const randomParticipant = toAdd[Math.floor(Math.random() * toAdd.length)];
        if (!arr.includes(randomParticipant)) {
            arr.push(randomParticipant);
        }
    }

    console.log(arr);
}

const testArr = () => {
    const array = ['hey', 'what', 'is', 'up'];

    array.splice(0, 2);

    console.log('spliced: ', array);
}

const testIf = () => {
    const num = 2;

    const arr = ['0', '1'];

    console.log(arr.length);
}

testIf();