import * as admin from "firebase-admin";
import { setGlobalOptions } from 'firebase-functions/v2'

if (!admin.apps.length) {
  admin.initializeApp();
}

setGlobalOptions({ region: "southamerica-east1" });

export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging();