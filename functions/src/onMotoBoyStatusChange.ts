import * as functions from "firebase-functions/v2";
import { db } from "./admin";
import { messaging } from "./admin";
import { Logger } from "./utils/Logger";

export const onMotoBoyStatusChange = functions.firestore.onDocumentUpdated(
  "motoboy/{uid}",
  async (event) => {
    const logger = new Logger();
    logger.log("onMotoBoyStatusChange triggered");

    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const uid = event.params.uid;

    if (!before || !after) {
      logger.error("Missing 'before' or 'after' data.");
      logger.printAll();
      return;
    }

    const previousStatus = before.status;
    const newStatus = after.status;

    logger.log(`Motoboy ${uid}: status alterado de ${previousStatus} para ${newStatus}`);

    if (previousStatus === newStatus) {
      logger.log("Status não mudou. Encerrando execução.");
      logger.printAll();
      return;
    }

    const tokenDoc = await db.collection("fcm_tokens").doc(uid).get();
    if (!tokenDoc.exists) {
      logger.warn(`Token não encontrado para motoboy ${uid}`);
      logger.printAll();
      return;
    }

    const token = tokenDoc.data()?.token;
    if (!token) {
      logger.warn(`Token vazio para motoboy ${uid}`);
      logger.printAll();
      return;
    }

    const tokenArray = [token];
    const topic = "deliveryRequest";

    if (newStatus === "ONLINE") {
      await subscribeToTopic(tokenArray);
    } else if (["OFFLINE", "BUSY"].includes(newStatus)) {
      await unsubscribeFromTopic(tokenArray);
      await removeFromQueueIfPresent(uid);
    }

    logger.printAll();

    // 🔽 Funções internas 🔽

    async function subscribeToTopic(tokens: string[]) {
      try {
        const result = await messaging.subscribeToTopic(tokens, topic);
        if (result.failureCount > 0) {
          const err = result.errors[0]?.error;
          logger.error(`Erro ao inscrever token: ${String(err)}`);
        } else {
          logger.log(`Token inscrito com sucesso no tópico ${topic}`);
        }
      } catch (error) {
        logger.error(`Falha ao inscrever token no tópico: ${String(error)}`);
      }
    }

    async function unsubscribeFromTopic(tokens: string[]) {
      try {
        const result = await messaging.unsubscribeFromTopic(tokens, topic);
        if (result.failureCount > 0) {
          const err = result.errors[0]?.error;
          logger.error(`Erro ao remover inscrição: ${String(err)}`);
        } else {
          logger.log(`Token removido com sucesso do tópico ${topic}`);
        }
      } catch (error) {
        logger.error(`Falha ao remover token do tópico: ${String(error)}`);
      }
    }

    async function removeFromQueueIfPresent(uid: string) {
      try {
        const queueDocRef = db.collection("queue").doc(uid);
        const queueDoc = await queueDocRef.get();
        if (queueDoc.exists) {
          await queueDocRef.delete();
          logger.log(`Motoboy ${uid} removido da fila`);
        } else {
          logger.log(`Motoboy ${uid} não estava na fila`);
        }
      } catch (error) {
        logger.error(`Erro ao remover da fila: ${String(error)}`);
      }
    }
  }
);
