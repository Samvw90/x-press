const express = require('express');
const seriesRouter = express.Router();
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  const sql = 'SELECT * FROM Series WHERE id = $seriesId';
  const values = { $seriesId: seriesId };
  db.get(sql, values, (err, series) => {
    if (err) {
      next(err);
    } else if (series) {
      req.series = series;
      next();
    } else {
      res.status(404).send();
    }
  });
});

seriesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Series', (err, series) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ series: series });
    }
  });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/:seriesId', (req, res, next) => {
  res.status(200).json({ series: req.series });
});

seriesRouter.post('/', (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    res.status(400).send();
  } else {
    const sql =
      'INSERT INTO Series (name, description) VALUES ($name, $description)';
    const values = {
      $name: name,
      $description: description,
    };
    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Series WHERE id = ${this.lastID}`,
          (err, series) => {
            res.status(201).json({ series: series });
          }
        );
      }
    });
  }
});

seriesRouter.put('/:seriesId', (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    res.status(400).send();
  } else {
    const sql =
      'UPDATE Series SET name = $name, description = $description WHERE id = $seriesId';
    const values = {
      $name: name,
      $description: description,
      $seriesId: req.series.id,
    };
    db.run(sql, values, (err) => {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Series WHERE id = ${req.series.id}`,
          (err, series) => {
            res.status(200).json({ series: series });
          }
        );
      }
    });
  }
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
  const issueSql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
  const issueValues = { $seriesId: req.params.seriesId };
  db.get(issueSql, issueValues, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      res.status(400).send();
    } else {
      const deleteSql = 'DELETE FROM Series WHERE Series.id = $seriesId';
      const deleteValues = { $seriesId: req.params.seriesId };
      db.run(deleteSql, deleteValues, (err) => {
        if (err) {
          next(err);
        } else {
          res.status(204).send();
        }
      });
    }
  });
});

module.exports = seriesRouter;
