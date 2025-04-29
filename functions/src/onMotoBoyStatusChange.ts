import * as functions from "firebase-functions/v2";
import { db } from "./admin";
import { messaging } from "./admin";

export const onMotoBoyStatusChange = functions.firestore.onDocumentUpdated(
    "motoboy/{uid}",
    async (event) => {
      const before = event.data?.before.data();
      const after = event.data?.after.data();
  
      if (!before || !after) {
        console.warn("Missing before or after data");
        return;
      }
  
      const previousStatus = before.status;
      const newStatus = after.status;
  
      if (previousStatus === newStatus) return;
  
      const uid = event.params.uid;
      const fcmTokenDoc = await db.collection("fcm_tokens").doc(uid).get();
  
      if (!fcmTokenDoc.exists) {
        console.warn(`No FCM token found for user ${uid}`);
        return;
      }
  
      const token = fcmTokenDoc.data()?.token;
      if (!token) {
        console.warn(`Token is empty for user ${uid}`);
        return;
      }
  
      const topic = "deliveryRequest";
  
      try {
        const tokenArray = [token];
        
        if (newStatus === "ONLINE") {
          const result = await messaging.subscribeToTopic(tokenArray, topic);
          if (result.failureCount > 0) {
            console.error(`Failed to subscribe token for user ${uid}:`, result.errors[0]);
          } else {
            console.log(`Successfully subscribed ${uid} to topic ${topic}`);
          }
        } else if (["OFFLINE", "BUSY"].includes(newStatus)) {
          const result = await messaging.unsubscribeFromTopic(tokenArray, topic);
          if (result.failureCount > 0) {
            console.error(`Failed to unsubscribe token for user ${uid}:`, result.errors[0]);
          } else {
            console.log(`Successfully unsubscribed ${uid} from topic ${topic}`);
          }
        }
      } catch (error) {
        console.error(`Error managing topic subscription for ${uid}:`, error);
      }
    }
  );