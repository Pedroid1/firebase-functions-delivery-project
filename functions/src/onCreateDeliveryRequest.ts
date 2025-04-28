import { messaging } from "./admin";
import { db } from "./admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onCreateDeliveryRequest = onDocumentCreated(
  'delivery_request/{docId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) {
      console.error("No delivery request data found");
      return;
    }

    const companyId = data.companyId;
    let companyName: string | undefined;

    try {
      const companyDoc = await db.collection('company').doc(companyId).get();
      if (companyDoc.exists) {
        const companyData = companyDoc.data();
        companyName = companyData?.name;
      }
    } catch (error) {
      console.error("Failed to fetch company name:", error);
    }

    const message = {
      topic: "deliveryRequest",
      notification: {
        title: "Entrega disponível!",
        body: companyName
          ? `Nova entrega para ${companyName}.`
          : "Nova entrega disponível no App."
      }
    };

    try {
      await messaging.send(message);
      console.log("Notification sent successfully");
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
);
