const express = require('express');
const artistRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

artistRouter.param('artistId', (req, res, next, artistId) => {
  const sql = 'SELECT * FROM Artist WHERE id = $artistId';
  const values = { $artistId: artistId };
  db.get(sql, values, (err, artist) => {
    if (err) {
      next(err);
    } else if (artist) {
      req.artist = artist;
      next();
    } else {
      res.status(404).send();
    }
  });
});

artistRouter.get('/', (req, res, next) => {
  db.all(
    'SELECT * FROM Artist WHERE is_currently_employed = 1',
    (err, artists) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({ artists: artists });
      }
    }
  );
});

artistRouter.get('/:artistId', (req, res, next) => {
  res.status(200).json({ artist: req.artist });
});

artistRouter.post('/', (req, res, next) => {
  const { name, dateOfBirth, biography } = req.body.artist;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  if (!name || !dateOfBirth || !biography) {
    res.status(400).send();
  } else {
    const sql =
      'INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)';
    const values = {
      $name: name,
      $dateOfBirth: dateOfBirth,
      $biography: biography,
      $isCurrentlyEmployed: isCurrentlyEmployed,
    };
    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Artist WHERE id = ${this.lastID}`,
          (err, artist) => {
            res.status(201).json({ artist: artist });
          }
        );
      }
    });
  }
});

artistRouter.put('/:artistId', (req, res, next) => {
  const { name, dateOfBirth, biography, isCurrentlyEmployed } = req.body.artist;
  if (!name || !dateOfBirth || !biography || !isCurrentlyEmployed) {
    res.status(400).send();
  } else {
    const sql = `UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE id = $artistId`;
    const values = {
      $name: name,
      $dateOfBirth: dateOfBirth,
      $biography: biography,
      $isCurrentlyEmployed: isCurrentlyEmployed,
      $artistId: req.artist.id,
    };

    db.run(sql, values, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(
          `SELECT * FROM Artist WHERE id = ${req.artist.id}`,
          (err, artist) => {
            res.status(200).json({ artist: artist });
          }
        );
      }
    });
  }
});

module.exports = artistRouter;
