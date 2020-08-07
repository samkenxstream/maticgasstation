'use strict';

const dotnet = require('dotenv');

dotnet.config({ path: path.join(__dirname, '.env'), silent: true })

const SAFELOW = process.env.SAFELOW || 30;
const STANDARD = process.env.STANDARD || 60;
const FAST = process.env.FAST || 90;
const DAGGER = process.env.DAGGER || 'wss://mumbai-dagger.matic.today';
const BUFFERSIZE = process.env.BUFFERSIZE || 500;

