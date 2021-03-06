#!/usr/bin/env node
import express from 'express';
import groupmeService from './groupmeService';
import spotifyService from './spotifyService';
import imageService from './imageService';
import http from 'http';
import morgan from 'morgan'
import bodyParser from 'body-parser';

const handleError = (error) => {
  if (error) {
    console.error(error);
    if (error.stack) {
      console.error(error.stack)
    }
  }
};

const done = (res) => {
  return () => {
    res.send('message processed');
    return 'done';
  }
}

const handleIncomingMessage = (req, res) => {
  return groupmeService.extractInfo(req.body)
    .then(spotifyService.extractTrackId)
    .then(spotifyService.retrieveTrackInfo)
    .then(imageService.createSummaryImage)
    .then(groupmeService.uploadImage)
    .then(groupmeService.sendImageLink)
    .then(done(res))
    .catch(handleError);
};

const server = express();

server.use(bodyParser.json());
server.use(morgan('common'));

server.get('/', function(req, res) {
  res.send('pong');
});

server.post('/', handleIncomingMessage);


server.get('/login', function(req, res) {
  res.redirect(spotifyService.generateTokenUrl());
});

server.get('/access_token', function(req, res) {
  const code = req.query.code;
  return spotifyService.setAccessToken(code)
    .then(() => res.sendStatus(200))
    .catch(handleError);
});

const port = process.env.PORT || 3000
http.createServer(server).listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
