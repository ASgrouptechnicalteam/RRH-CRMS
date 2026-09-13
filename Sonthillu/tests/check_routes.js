const http = require('http');

const urls = [
  '/properties/1',
  '/properties/code/PROP-1',
  '/projects/1',
  '/projects/code/PROJ-1',
  '/search',
  '/compare',
  '/shortlist',
  '/login',
  '/register',
  '/account',
  '/non-existent-route',
];

async function check() {
  for (const path of urls) {
    const res = await fetch(`http://localhost:3000${path}`);
    console.log(`${path} - ${res.status}`);
  }
}
check();
