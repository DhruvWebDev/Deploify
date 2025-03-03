import SmeeClient from 'smee-client';
const smee = new SmeeClient({
    source: 'https://smee.io/D1YB4T8KL8k6pt8k',
    target: 'http://localhost:3000/',
    logger: console
});
const events = smee.start();
