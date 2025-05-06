import { db } from "./admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";

export const onDeleteDeliveryRequest = onDocumentDeleted("delivery_request/{docId}", async (event) => {
  const deletedData = event.data?.data();

  if (!deletedData) {
    console.log("Nenhum dado no documento excluído.");
    return;
  }

  const motoBoyId = deletedData.motoBoyId as string;

  if (!motoBoyId) {
    console.log("Nenhum motoBoyId encontrado no documento excluído.");
    return;
  }

  const querySnapshot = await db.collection("delivery_request")
    .where("motoBoyId", "==", motoBoyId)
    .where("completed", "==", false)
    .get();

  if (querySnapshot.empty) {
    console.log(`Nenhuma outra entrega ativa encontrada para o motoboy ${motoBoyId}`);

    await db.collection("motoboy").doc(motoBoyId).update({
      status: "ONLINE",
    });

    console.log(`Status do motoboy ${motoBoyId} atualizado para ONLINE.`);
  } else {
    console.log(`O motoboy ${motoBoyId} ainda possui entregas ativas.`);
  }
});
