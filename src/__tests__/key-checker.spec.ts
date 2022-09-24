/* eslint-disable import/first */
import path from 'path';

process.argv.push('--filePath', path.resolve(__dirname, 'main-es.json'));
process.argv.push('--apiProvider', 'deepl');
process.argv.push('--to', 'en');
process.argv.push('--key', 'test');
process.argv.push('--baseName', 'main');
process.argv.push('--testKeys', 'true');

// import * as axios from 'axios';
import { DeeplAPI } from '../translate/providers/deepl-api';

describe('testKeys works correctly', () => {
  test('When translating json from ES to EN with testKeys, it should log them', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    new DeeplAPI().translate();
    expect(consoleSpy).toHaveBeenCalledWith({});
    expect(consoleSpy).toHaveBeenCalledWith({
      translation: {
        'not-found': 'Esta linea no está en el otro fichero',
        complex: { inner: 'si' },
      },
      'not-found-either': 'Esta linea tampoco está en el otro fichero',
    });
  });
});
