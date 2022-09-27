/* eslint-disable import/first */
import path from 'path';

import { DeeplAPI } from '../translate/providers/deepl-api';

describe('testKeys works correctly', () => {
    test('When testing from ES to EN with testKeys, it should log them', () => {
        const deeplAPI = new DeeplAPI();
        deeplAPI.argv = {
            apiProvider: 'deepl',
            key: 'test',
            region: '',
            filePath: path.resolve(__dirname, 'main-es.json'),
            dirPath: '',
            from: '',
            to: 'en',
            override: false,
            baseName: 'main-',
            testKeys: true
        };
        const keys = deeplAPI.getKeys();
        expect(keys).toEqual({
            toAdd: {
                translation: {
                    'not-found': 'Esta linea no está en el otro fichero',
                    complex: { inner: 'si' }
                },
                'not-found-either': 'Esta linea tampoco está en el otro fichero'
            },
            toDelete: {}
        });
    });
});
