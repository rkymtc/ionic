import { writeFile } from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const targetPath = './src/environments/environment.ts';
const targetProdPath = './src/environments/environment.prod.ts';

const envConfigFile = `
export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: '${process.env['FIREBASE_API_KEY']}',
    authDomain: '${process.env['FIREBASE_AUTH_DOMAIN']}',
    projectId: '${process.env['FIREBASE_PROJECT_ID']}',
    storageBucket: '${process.env['FIREBASE_STORAGE_BUCKET']}',
    messagingSenderId: '${process.env['FIREBASE_MESSAGING_SENDER_ID']}',
    appId: '${process.env['FIREBASE_APP_ID']}',
    measurementId: '${process.env['FIREBASE_MEASUREMENT_ID']}',
    databaseURL: '${process.env['FIREBASE_DATABASE_URL']}'
  }
};
`;

const envProdConfigFile = `
export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: '${process.env['FIREBASE_API_KEY']}',
    authDomain: '${process.env['FIREBASE_AUTH_DOMAIN']}',
    projectId: '${process.env['FIREBASE_PROJECT_ID']}',
    storageBucket: '${process.env['FIREBASE_STORAGE_BUCKET']}',
    messagingSenderId: '${process.env['FIREBASE_MESSAGING_SENDER_ID']}',
    appId: '${process.env['FIREBASE_APP_ID']}',
    measurementId: '${process.env['FIREBASE_MEASUREMENT_ID']}',
    databaseURL: '${process.env['FIREBASE_DATABASE_URL']}'
  }
};
`;

writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log(`Angular environment.ts file generated`);
  }
});

writeFile(targetProdPath, envProdConfigFile, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log(`Angular environment.prod.ts file generated`);
  }
}); 