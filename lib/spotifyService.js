import _ from 'lodash'
import SpotifyWebApi from 'spotify-web-api-node';
import config from 'config';
const spotifyConfig = config.get('spotify');
const spotifyApi = new SpotifyWebApi(spotifyConfig);

const retrieveTrackInfo = (trackIdAndSharedByName) => {
  console.log(`retrieving info from spotify for track with id: ${trackIdAndSharedByName.trackId}`); //`
  return spotifyApi.getTrack(trackIdAndSharedByName.trackId)
    .then((data) => {
      console.log('received data from spotify: ', data);
      const body = data.body;

      const trackInfo = {
        album: body.album.name,
        artists: _.map(body.artists, 'name').join(),
        name: body.name
      };

      const imageUrl = (() => {
        const url = body.album.images[0];
        return url && url.url;
      })();

      return Promise.resolve({
        trackInfo,
        imageUrl,
        sharedByName: trackIdAndSharedByName.sharedByName
      });
    });
};

const extractTrackId = (() => {
  // plucks ID from https://open.spotify.com/track/6mfKEPTYiBAYZ9z0429jsp
  const linkRegex = /https:\/\/open\.spotify\.com\/track\/(\S{22})/i;

  return (messageInfo) => {
    return new Promise((resolve, reject) => {
      const matches = linkRegex.exec(messageInfo.message);
      if (matches && matches[1]) {
        const trackId = matches[1];
        console.log(`spotify track id found: ${trackId}`)
        resolve({
          trackId,
          sharedByName: messageInfo.sharedByName
        });
      } else {
        reject();
      }
    });
  };
})();

export default {
  retrieveTrackInfo,
  extractTrackId
};
