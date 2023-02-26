const cron = require('node-cron');

const test = cron.schedule('*/2 * * * * *' , () => {
    console.log('running every 2 seconds!');
});

// test.start();