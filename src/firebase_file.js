import firebase from "@firebase/app-compat";
import "@firebase/auth-compat";
import "@firebase/firestore-compat";
import "@firebase/storage-compat";

const firebaseConfig = {
  apiKey: "AIzaSyC20eE_3FGGhzVCL-Hnx2ye0fskZ-UElrs",
  authDomain: "prosport-guru-inc.firebaseapp.com",
  projectId: "prosport-guru-inc",
  storageBucket: "prosport-guru-inc.appspot.com",
  messagingSenderId: "384851572120",
  appId: "1:384851572120:web:6b31c6017fb9b4ac6367ed",
  measurementId: "G-MRCDZV9WQT"
};

let app;

if(firebase.apps.length===0){
  app=firebase.initializeApp(firebaseConfig);
}else{
  app=firebase.app();
}

const auth=app.auth();
const db=app.firestore();
const storage=app.storage();

export {auth,db,storage,firebase};