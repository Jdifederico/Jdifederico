import {initializeApp} from "firebase/app";
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth} from "firebase/auth";
import { getFirestore} from "firebase/firestore";
import 'firebase/compat/firestore';

var firebaseConfig = {
    apiKey: "AIzaSyBLRfT0lk65I2sQ7nJaHVWddKclD6ohiHI",
    authDomain: "alianza-47fa6.firebaseapp.com",
    databaseURL: "https://alianza-47fa6.firebaseio.com",
    projectId: "alianza-47fa6",
    storageBucket: "alianza-47fa6.appspot.com",
    messagingSenderId: "279436409898",
    appId: "1:279436409898:web:55c0f73ce790d363981753",
    measurementId: "G-PCR63KEL13",
    synchronizeTabs:true
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const enablePersistence = async () =>{
    const ua = navigator.userAgent;
    console.log('uia = ' + ua);
    // memoized values
    const isIphone = ua.indexOf('iPhone') !== -1 || ua.indexOf('iPod') !== -1;

    if(!isIphone){

        try{
            const persistenceEnabled = await enableIndexedDbPersistence(db);
        }catch (e) {
            console.log('error enabling persistence', e);
        }
    }
}

export const auth = getAuth(app);
export default app;