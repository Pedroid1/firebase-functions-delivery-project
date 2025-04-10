import { messaging } from "./admin";
import * as functions from 'firebase-functions/v2';

export const onCreateDeliveryRequest = functions.firestore.onDocumentCreated(
  'delivery_request/{docId}', 
  async (event) => {
    const message = {
      topic: "/topics/deliveryRequest",
      notification: {
        title: "Entrega",
        body: `Nova entrega disponível no app!`
      }
    };
    return messaging.send(message);
  }
);
