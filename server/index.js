const keys = require('./keys');

// Express App setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// new app responds to requests from React app
const app = express();

// makes requests from different domains
app.use(cors());

// take body of html request and turn into json
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on("connect", client => {
    client
      .query("CREATE TABLE IF NOT EXISTS values (number INT)")
      .catch(err => console.error(err));
});


// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000
});


// require duplicate because when redis listening on a port
// instance cannot then be used for other purposes 
const redisPublisher = redisClient.duplicate();

// Express route handlers
app.get('/', (req, res) => {
    res.send('Hi');
});

// retrieve only information from database
app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

// retrieve from redis, all values ever requested
app.get('/values/current', async (req,res) => {
    redisClient.hgetall('values',(err, values) => {
        res.send(values);
    });
});

// receive new values from react app
app.post('/values', async(req, res) => {
    const index = req.body.index;

    if(parseInt(index) > 40){
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values',index,'Nothing yet!');
    redisPublisher.publish('insert', index);
    // permenently add to postgress
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true });
});

app.listen(5000, err => {
    console.log('Listening');
});