import { db } from "./admin";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";

export const onDeleteDeliveryRequest = onDocumentDeleted("delivery_request/{docId}", async (event) => {
  const deletedData = event.data?.data();

  if (!deletedData) {
    console.log("Nenhum dado no documento excluído.");
    return;
  }

  const documentReference = deletedData.motoBoyDocRef as FirebaseFirestore.DocumentReference;

  if (!documentReference) {
    console.log("Nenhuma referência do MotoBoy encontrada no documento excluído.");
    return;
  }

  const querySnapshot = await db.collection("delivery_request")
  .where("motoBoyDocRef", "==", documentReference)
  .where("completed", "==", false)
  .get();

  if (querySnapshot.empty) {
    console.log(`Nenhum outro documento na coleção "delivery_request" referencia ${documentReference.path}`);

    await documentReference.update({
      status: "ONLINE",
    });

    console.log(`Documento ${documentReference.path} atualizado com sucesso.`);
  } else {
    console.log(`Existem outros documentos referenciando ${documentReference.path}`);
  }
});
