const express = require('express');
const app = express();
app.use(express.json());
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '23BQ1A05D2',
  database: 'vehicle_scheduling'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});
app.get('/schedule', (req, res) => {
  const query = 'SELECT * FROM schedule';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching schedule:', err);
      res.status(500).json({ error: 'Failed to fetch schedule' });
      return;
    }
    res.json(results);
  });
});

app.get('/schedule/efficient', (req, res) => {
  const query = `
    SELECT
      schedule_id,
      vehicle_id,
      operational_score,
      service_duration,
      daily_mechanic_hour_budget,
      operational_score / NULLIF(service_duration, 0) AS efficiency
    FROM schedule
    ORDER BY efficiency DESC
    LIMIT 1
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching most efficient schedule:', err);
      res.status(500).json({ error: 'Failed to fetch most efficient schedule' });
      return;
    }

    if (!results || results.length === 0) {
      res.status(404).json({ error: 'No schedule entries found' });
      return;
    }

    res.json(results[0]);
  });
});

app.post('/schedule', (req, res) => {
  const { vehicle_id, operational_score, service_duration, daily_mechanic_hour_budget } = req.body;
  const query = 'INSERT INTO schedule (vehicle_id, operational_score, service_duration, daily_mechanic_hour_budget) VALUES (?,?,?,?)';

  connection.query(
    query,
    [vehicle_id, operational_score, service_duration, daily_mechanic_hour_budget],
    (err, result) => {
      if (err) {
        console.error('Error inserting schedule:', err);
        res.status(500).json({ error: 'Failed to insert schedule' });
        return;
      }

      res.status(201).json({ message: 'Schedule inserted successfully', scheduleId: result.insertId });
    }
  );
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
     