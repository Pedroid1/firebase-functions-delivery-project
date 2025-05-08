import { messaging } from "./admin";
import { db } from "./admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { Logger } from "./utils/Logger";

export const onCreateDeliveryRequest = onDocumentCreated(
  "delivery_request/{docId}",
  async (event) => {
    const logger = new Logger();
    logger.log("onCreateDeliveryRequest triggered");

    const data = event.data?.data();
    if (!data) {
      logger.error("No delivery request data found");
      logger.printAll();
      return;
    }

    const companyId = data.companyId;
    const docId = event.params.docId;
    logger.log(`Nova entrega criada - docId: ${docId}, empresaId: ${companyId}`);

    const companyName = await getCompanyName(companyId);
    const message = buildNotification(companyName);

    await sendNotification(message);

    logger.printAll();

    // 🔽 🔽 🔽 Funções locais reutilizáveis abaixo 🔽 🔽 🔽

    async function getCompanyName(companyId: string): Promise<string | undefined> {
      try {
        const companyDoc = await db.collection("company").doc(companyId).get();
        if (companyDoc.exists) {
          const name = companyDoc.data()?.name;
          logger.log(`Empresa encontrada: ${name}`);
          return name;
        } else {
          logger.warn(`Empresa não encontrada: ${companyId}`);
        }
      } catch (error) {
        logger.error(`Erro ao buscar empresa ${companyId}: ${String(error)}`);
      }
    }

    function buildNotification(companyName?: string) {
      const body = companyName
        ? `Nova entrega para ${companyName}.`
        : "Nova entrega disponível no App.";

      logger.log(`Notificação gerada: "${body}"`);

      return {
        topic: "deliveryRequest",
        notification: {
          title: "Entrega disponível!",
          body,
        },
      };
    }

    async function sendNotification(message: any) {
      try {
        await messaging.send(message);
        logger.log("Notificação enviada com sucesso");
      } catch (error) {
        logger.error(`Erro ao enviar notificação: ${String(error)}`);
      }
    }
  }
);
