import * as functions from "firebase-functions";
import { auth } from "./admin";

type SetClaimRequestData = {
  uid: string;
  role: "motoboy" | "empresa" | "admin";
};

export const setCustomUserClaims = functions.https.onCall(
  async (request: functions.https.CallableRequest<SetClaimRequestData>) => {
    const { uid, role } = request.data;

    if (!request.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Somente usuários autenticados podem definir claims."
      );
    }

    const requesterUid = request.auth.uid;
    const requester = await auth.getUser(requesterUid);

    if (requester.customClaims?.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Apenas administradores podem definir claims."
      );
    }

    if (!uid || !["motoboy", "empresa", "admin"].includes(role)) {
      throw new functions.https.HttpsError("invalid-argument", "Dados inválidos.");
    }

    try {
      await auth.setCustomUserClaims(uid, { role });
      return { message: `Custom claim definida: ${uid} => ${role}` };
    } catch (error: any) {
      console.error("Erro ao definir custom claim:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Erro ao definir o custom claim.",
        error.message
      );
    }
  }
);
