const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV, DATABASE_URL } = require('./config');
require('dotenv').config();
const jsonParser = express.json();
const app = express();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const knex = require('knex');

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
})

const insertRows = function(rows) {
  // console.log(rows)
  const rowsToInsert = rows.map(row => ({
    full_name: row[0],
    entries: parseFloat(row[1]),
    
  }));
 
  return db('raffle_entries').insert(rowsToInsert)
    .then(rows => {
      return rows
    })
    .catch((err) => res.status(400).json(err))
}

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

const getEntries = function() {
  return db('raffle_entries').select('*')
}
const deleteAllEntries = function() {
  return db.raw('TRUNCATE raffle_entries RESTART IDENTITY CASCADE')
}

app.get('/sbc/entries', (req, res, next) => {
  getEntries()
    .then(entries => {
      console.log(entries)
      res.json(entries)
    })
    .catch(next)
  
})

app.delete('/sbc/entries', (req, res, next) => {
  deleteAllEntries()
    .then(() => 
      res.status(204).end()
    )
    .catch(next);
})
app.post('/sbc/entries', upload.single('csvFile'), (req, res) => {
     
  let columns = [];
  try {
 
    const csvFile = req.file.buffer.toString();
    const rows = csvFile.split('\n');
    
    for(let row of rows) {
      columns.push(row.replace(/"/g, '').split(','));
      
    }
    columns.shift();
    columns.pop();
    insertRows(columns)
      .then(rows => {
        res.status(201).json(rows);
      })


  
  } catch(err) {
    console.log(err);
    res.status(400).json('Error')
  }
  
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if(NODE_ENV === 'production') {
    response = { error: { message: 'Internal Server Error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
})

module.exports = app;
