#!/usr/bin/env node
import groupmeService from './groupmeService';
import spotifyService from './spotifyService';
import imageService from './imageService';

const handleError = (error) => {
  if (error) {
    console.error(error);
    if (error.stack) {
      console.error(error.stack)
    }
  }
};

const handleIncomingMessage = (message) => {
  return groupmeService.extractInfo(message)
    .then(spotifyService.extractTrackId)
    .then(spotifyService.retrieveTrackInfo)
    .then(imageService.createSummaryImage)
    .then(groupmeService.uploadImage)
    .then(groupmeService.sendImageLink)
    .catch(handleError);
};

groupmeService.retrieveMyUserId()
  .then((userId) => {
    groupmeService.createMessageListener(userId, handleIncomingMessage);
  })
  .catch(handleError);
