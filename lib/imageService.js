import _ from 'lodash';
import fs from 'fs-extra';
import https from 'https';
import path from 'path';
import defaultGm from 'gm';
const gm = defaultGm.subClass({imageMagick: true});

const imageDirectory = path.resolve(__dirname, '..', 'images');

const createSummaryImage = (() => {

  const retrieveImageDimensions = (outputImageName, resolve, reject) => {
    gm(outputImageName).size((err, size) => {
      if (err) {
        reject(err)
      } else {
        resolve({
          outputImageName,
          size
        });
      }
    })
  }

  const backgroundColor = '#000000';
  const setupDefaultGm = (outputImageName, gmOperations) => {
    return new Promise((resolve, reject) => {
      const presetGm =
        gm(3000, 2000, backgroundColor)
          .fill('#EEEEEEEE')
          .font('Helvetica-Narrow-Bold')

      gmOperations(presetGm)
        .trim()
        .write(outputImageName, function(error, data) {
          if (error) {
            reject(error);
          } else {
            retrieveImageDimensions(outputImageName, resolve, reject);
          }
        })
    });
  };

  const generateImageName = () => path.resolve(imageDirectory, new Date().getTime() + Math.random().toString(36).substring(7) + '.png');

  const createImages = (info) => {
    const createTrackInfoImage = (trackInfo) => {
      const text =
      `
Name: ${trackInfo.name}
Artist(s): ${trackInfo.artists}
Album: ${trackInfo.album}
      `
      return setupDefaultGm(generateImageName(), (presetGm) => {
        return presetGm
          .pointSize(50)
          .drawText(20, 100, text)
          .density(90)
      })
    }

    const retrieveAlbumArtImage = (() => {
      const outputImageName = generateImageName();
      const file = fs.createWriteStream(outputImageName);

      return (url) => {
        return new Promise((resolve, reject) => {
          console.log('retrieving image from url: ', url);

          https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
              file.close(() => {
                retrieveImageDimensions(outputImageName, resolve, reject);
              });
            });
          }).on('error', (error) => {
            console.error('unable to retrieve album art (using fallback)', error);
            fs.copy(path.resolve(imageDirectory, 'fallback-album-art.png'), outputImageName, function (err) {
              if (err) {
                reject(err)
              } else {
                retrieveImageDimensions(outputImageName, resolve, reject);
              }
            })
          });
        });
      }
    })();

    const createSharedBy = (name) => {
      return setupDefaultGm(generateImageName(), (presetGm) => {
        return presetGm
          .pointSize(30)
          .drawText(20, 100, `Shared by: ${name}`)
      });
    };

    return Promise.all([
      createTrackInfoImage(info.trackInfo),
      retrieveAlbumArtImage(info.imageUrl),
      createSharedBy(info.sharedByName)
    ])
  };

  const padImages = (imageNamesAndSizes) => {
    const maxWidth = _.chain(imageNamesAndSizes)
      .map('size.width')
      .max()
      .value();

    const paddedImageNamesPromise = _.map(imageNamesAndSizes, (imageNameAndSize) => {
      const outputImageName = imageNameAndSize.outputImageName;
      const padding = (maxWidth - imageNameAndSize.size.width) / 2;
      return new Promise((resolve, reject) => {
        gm(outputImageName)
          .colorspace('CMYK')
          .borderColor(backgroundColor)
          .border(padding, 0)
          .write(outputImageName, (error, data) => {
            if (error) {
              reject(error);
            } else {
              resolve(outputImageName);
            }
          });
      })
    });

    return Promise.all(paddedImageNamesPromise)
  }

  const mergeImages = (paddedImageNames) => {
    return new Promise((resolve, reject) => {
      const finalImageName = generateImageName();
      const gmToAppend =
        gm(0, 0, backgroundColor)
          .colorspace('CMYK');

      _.each(paddedImageNames, (paddedImageName) => {
        gmToAppend.append(paddedImageName)
      });

      gmToAppend
        .colorspace('CMYK')
        .borderColor(backgroundColor)
        .border(25, 25)
        .write(finalImageName, (error) => {
          if (error) {
            reject(error);
          } else {
            _.each(paddedImageNames, (paddedImageName) => {
              fs.unlink(paddedImageName)
            });
            resolve(finalImageName);
          }
        });
    })
  }

  return (info) => {
    return createImages(info)
      .then(padImages)
      .then(mergeImages)
  }
})();

export default {
  createSummaryImage
}


