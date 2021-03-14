const axios = require('axios');
const SHA256 = require('crypto-js/sha256');
const config = require('./config.json');

let startTime = new Date().getTime();
let hashes = 0;
let intervalId = null;

const showStats = () => {
    let currTime = new Date().getTime();
    let timeDiff = (currTime - startTime) / 1000;
    let hashRate = Math.round(hashes / timeDiff / 1000);
    console.log(`STATS - ${hashRate} KH/s.`);
};

const submitSolution = (miner_address, timestamp, nonce) => {
    axios.post('http://127.0.0.1:3500/api/mining/submit', {
        miner_address: miner_address,
        timestamp: timestamp,
        nonce: nonce
    },
    {
        Headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => {
        if(res.data.status === 200) {
            console.log(`Share accepted. (nonce: ${nonce}).\n`);
        } else if(res.data.status === 400) {
            console.log(`Share rejected.`);
        }

        runWorker();
    })
    .catch(err => {

    });
};

const runWorker = () => {
    axios.get('http://127.0.0.1:3500/api/mining/candidate')
    .then((res) => {
        if(res.data.status === 200) {
            startTime = new Date().getTime();
            shares = 0;
    
            let miningData = res.data.data;
            console.log(`Job received.`);
            console.log(`Difficulty : ${miningData.difficulty}`);
            console.log(`Payload    : ${miningData.payload}`);
    
            let timestamp = new Date().getTime();
            let nonce = "0x0";
            let hash = SHA256(`${miningData.payload}${new Date().getTime()}${nonce}`).toString();
            let zeros = new Array(miningData.difficulty + 1).join('0');
    
            while(hash.substring(0, miningData.difficulty) != zeros) {
                nonce = `0x${(parseInt(nonce, 16) + 1).toString(16)}`;
                timestamp = new Date().getTime();
                hash = SHA256(`${miningData.payload}${timestamp}${nonce}`).toString();
                hashes += 1;
    
                // if(hashes % 500000 == 0) {
                //     showStats();
                // }
            }

            console.log(`\nBlock found`);
            console.log(`Nonce : ${nonce}`);
            console.log(`Hash  : ${hash}`);
    
            submitSolution(config.miner_address, timestamp, nonce);
        }
    })
    .catch((err) => {
        console.log(err);
    });
};


console.log('Dexcoin Miner Started.\n');
runWorker();
