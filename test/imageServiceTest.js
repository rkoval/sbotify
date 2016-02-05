import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import path from 'path';
import imageService from '../dist/imageService.js';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('imageService', () => {
  describe('#createImageSummary', () => {
    it('should generate an image', () => {
      const filenamePromise = imageService.createSummaryImage({
        trackInfo: {
          name: 'Icky Thump',
          artists: 'The White Stripes',
          album: 'Icky Thump'
        },
        imageUrl: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
        sharedByName: 'Ryan Koval'
      });

      return filenamePromise.then((filename) => {
        expect(fs.existsSync(filename)).to.be.true;
        fs.unlink(filename);
      });
    });
  });
});
