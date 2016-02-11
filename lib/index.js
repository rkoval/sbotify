#!/usr/bin/env node
import express from 'express';
import groupmeService from './groupmeService';
import spotifyService from './spotifyService';
import imageService from './imageService';
import http from 'http';
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
server.use((req, res, next) => {
  console.log(`Received ${req.method} with body`, req.body);
  next();
});

server.get('/', function(req, res) {
  res.send('pong');
});

server.post('/', handleIncomingMessage);

const port = process.env.PORT || 3000
http.createServer(server).listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});
