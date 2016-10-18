import groupme from 'groupme';
import fs from 'fs';
import config from 'config';
import _ from 'lodash';

const groupmeConfig = config.get('groupme');
const accessToken = groupmeConfig.accessToken;

const retrieveMyUserId = () => {
  return groupme.Stateless.Users.me.Q(accessToken)
    .then((data) => {
      console.log("Your user id is", data.id, "and your name is", data.name);
      return Promise.resolve(data.id);
    });
};

const extractInfo = (message) => {
  return new Promise((resolve, reject) => {
    if (message.sender_type !== 'bot') {
      resolve({
        message: message.text,
        sharedByName: message.name
      });
    } else {
      reject()
    }
  });
};

const uploadImage = (imagePath) => {
  return groupme.ImageService.post.Q(imagePath)
    .then((data) => {
      console.log('received response from image upload:', data);
      fs.unlink(imagePath);
      return Promise.resolve(data.picture_url);
    });
};

const pickMessage = () => {
  const possibleMessages = [
    'whoa what a sweet track!',
    'dope shit',
    'CRUNCHY',
    'check this shit out!!!!',
    'more awesome tunez',
    'killer jam',
    'so stoke',
    'wow. much music. very listen.',
    'this might just be the best song i\'ve ever heard',
    'omg no way',
    'this song probably doesn\'t suck'
  ];

  return _.shuffle(possibleMessages)[0];
};

const sendImageLink = (() => {
  const Bots = groupme.Stateless.Bots;
  const botId = config.get('groupme.botId');

  return (pictureUrl = '') => {
    console.log('sending message to groupme with picture url: ', pictureUrl);
    const text = pickMessage();
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
  extractInfo,
  uploadImage,
  pickMessage,
  sendImageLink
};
