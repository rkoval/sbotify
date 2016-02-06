import groupme from 'groupme';
import fs from 'fs';
import config from 'config';
const groupmeConfig = config.get('groupme');

const accessToken = groupmeConfig.accessToken;

const retrieveMyUserId = () => {
  return groupme.Stateless.Users.me.Q(accessToken)
    .then((data) => {
      console.log("Your user id is", data.id, "and your name is", data.name);        
      return Promise.resolve(data.id);
    });
};

const createMessageListener = (() => {
  const IncomingStream = groupme.IncomingStream;

  return (userId, handleIncomingMessage) => {
    const iStream = new IncomingStream(accessToken, userId);
    iStream.on('connected', () => {
      console.log('connected to groupme');
    });
    iStream.on('disconnected', () => {
      console.error('disconnected from groupme');
    });
    iStream.on('error', (message, payload) => {
      console.error('error from groupme', message, payload);
    });
    iStream.on('message', handleIncomingMessage);
    iStream.connect();
  };
})();

const extractInfo = (message) => {
  const groupId = groupmeConfig.groupId;

  return new Promise((resolve, reject) => {
    const data = message.data;
    if (data) {
      const messageData = data.subject;
      if (messageData.sender_type !== 'bot' && groupId === messageData.group_id) {
        console.log('parsing groupme message: ', JSON.stringify(messageData, null, 2))
        resolve({
          message: messageData.text,
          sharedByName: messageData.name
        });
      } else {
        reject()
      }
    } else {
      reject()
    }
  });
};

const uploadImage = (() => {
  const ImageService = groupme.ImageService;
  const fs = require('fs');

  return (imagePath) => {
    return ImageService.post.Q(imagePath)
      .then((data) => {
        console.log('received response from image upload:', data); 
        fs.unlink(imagePath);
        return Promise.resolve(data.picture_url);
      });
  };
})();

const sendImageLink = (() => {
  const Bots = groupme.Stateless.Bots;
  const botId = '8679bdbe07e4bfe278936b9fab';

  return (pictureUrl = '') => {
    console.log('sending message to groupme with picture url: ', pictureUrl);
    const text = 'whoa what a sweet track!';
    const options = {
      picture_url: pictureUrl
    };

    return Bots.post.Q(accessToken, botId, text, options)
      .then((data) => { 
        console.log(`received response from groupme while sending message: ${data}`);
        Promise.resolve();
      });
  };
})();

export default {
  retrieveMyUserId,
  createMessageListener,
  extractInfo,
  uploadImage,
  sendImageLink
};
