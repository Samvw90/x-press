const express = require('express');
const issuesRouter = express.Router({ mergeParams: true });
const sqlite3 = require('sqlite3');
const seriesRouter = require('./series');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

issuesRouter.param('issueId', (req, res, next, issueId) => {
  const sql = 'SELECT * FROM Issue WHERE Issue.id = $issueId';
  const values = {
    $issueId: issueId,
  };
  db.get(sql, values, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      next();
    } else {
      res.status(404).send();
    }
  });
});

issuesRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Issue WHERE Issue.series_id = $seriesId';
  const values = {
    $seriesId: req.params.seriesId,
  };
  db.all(sql, values, (err, issues) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ issues: issues });
    }
  });
});

issuesRouter.post('/', (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  const artistSql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
  const artistValues = { $artistId: artistId };
  db.get(artistSql, artistValues, (err, artist) => {
    if (err) {
      next(err);
    } else {
      if (!name || !issueNumber || !publicationDate || !artist) {
        return res.status(400).send();
      } else {
        const sql =
          'INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)';
        const values = {
          $name: name,
          $issueNumber: issueNumber,
          $publicationDate: publicationDate,
          $artistId: artistId,
          $seriesId: req.params.seriesId,
        };
        db.run(sql, values, function (err) {
          if (err) {
            next(err);
          } else {
            db.get(
              `SELECT * FROM Issue WHERE Issue.id = ${this.lastID}`,
              (err, issue) => {
                res.status(201).json({ issue: issue });
              }
            );
          }
        });
      }
    }
  });
});

issuesRouter.put('/:issueId', (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  const artistSql = 'SELECT * FROM Artist WHERE Artist.id = $artistId';
  const artistValues = { $artistId: artistId };
  db.get(artistSql, artistValues, (err, artist) => {
    if (!name || !issueNumber || !publicationDate || !artist) {
      return res.status(400).send();
    } else {
      const sql =
        'UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId WHERE Issue.id = $issueId';
      const values = {
        $name: name,
        $issueNumber: issueNumber,
        $publicationDate: publicationDate,
        $artistId: artistId,
        $issueId: req.params.issueId,
      };
      db.run(sql, values, function (err) {
        if (err) {
          next(err);
        } else {
          db.get(
            `SELECT * FROM Issue WHERE Issue.id = ${req.params.issueId}`,
            (err, issue) => {
              res.status(200).json({ issue: issue });
            }
          );
        }
      });
    }
  });
});

issuesRouter.delete('/:issueId', (req, res, next) => {
  const sql = 'DELETE FROM Issue WHERE Issue.id = $issueId';
  const value = {
    $issueId: req.params.issueId,
  };
  db.run(sql, value, (err) => {
    if (err) {
      next(err);
    } else {
      res.status(204).send();
    }
  });
});

module.exports = issuesRouter;
