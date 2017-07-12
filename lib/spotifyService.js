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
  const linkRegex = /https?:\/\/open\.spotify\.com\/track\/(\S{22})/i;

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
        console.log('ignoring message with no spotify track URL');
        reject();
      }
    });
  };
})();

const generateTokenUrl = () => {
  const scopes = [];
  const state = 'sbotify';
  return spotifyApi.createAuthorizeURL(scopes, state);
};

const setAccessToken = (code) => {
  return spotifyApi.authorizationCodeGrant(code)
    .then((data) => {
      console.log('The token expires in ' + data.body['expires_in']);
      console.log('The refresh token is ' + data.body['refresh_token']);
      console.log('The access token is ' + data.body['access_token']);

      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
    });
};

export default {
  retrieveTrackInfo,
  extractTrackId,
  generateTokenUrl,
  setAccessToken,
};
