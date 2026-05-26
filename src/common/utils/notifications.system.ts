import { getIO } from '../config/socketManager';
import { getFirebaseAdmin } from '../config/firebaseAdminSdk';


export function emitNotification(channel: string, body: any): void {
    const io = getIO();
    if (!io) {
        return;
    }

    io.emit(channel, body);
}

export async function sendDeviceNotification(device_token: string, title: string, body: string) {
    if (!device_token?.trim()) {
        return;
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
        console.warn('⚠️ Firebase Admin SDK not initialized. Cannot send device notification.');
        return { success: false, message: 'Firebase Admin SDK not initialized' };
    }


    try {
        const message = {
            notification: { title, body },
            data: { title, body },
            token: device_token.trim(),
        };

        const response = await admin.messaging().send(message);

        console.log("✅ FCM notification sent:", response);

        return { success: true, response };
    } catch (error: any) {
        const STALE_TOKEN_CODES = [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
            'messaging/invalid-argument',
        ];

        if (STALE_TOKEN_CODES.includes(error?.errorInfo?.code)) {
            console.warn(`⚠️ Invalid/stale FCM token: ${device_token}`);
            return { success: false, message: 'Device token was invalid' };
        }

        console.error("Error sending device notification:", error);
        throw error;
    }
}

export async function sendTopicNotification(topic: string, title: string, body: string) {
    const admin = getFirebaseAdmin();
    if (!admin) {
        console.warn('Firebase Admin SDK not initialized. Cannot send topic notification.');
        return { success: false, message: 'Firebase Admin SDK not initialized' };
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            topic,
        };

        const response = await admin.messaging().send(message);
        return response;
    } catch (error: any) {
        console.error("Error sending notification:", error);
        throw error;
    }
}