import chai from 'chai';
import groupmeService from '../lib/groupmeService.js';

chai.should()

describe('groupmeService', () => {
  describe('#pickMessage', () => {
    it('choose a message from a list of possible messages', () => {
      const message = groupmeService.pickMessage();
      message.should.be.a('string');
    });
  });
});

