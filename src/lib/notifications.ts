import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and return the Expo push token.
 * Returns null on web or if permission is denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

/**
 * Schedule a daily training reminder at the given hour:minute.
 * Cancels any existing training reminder first.
 */
export async function scheduleTrainingReminder(
  hour: number,
  minute: number
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  // Cancel existing training reminders before scheduling new one
  await cancelByIdentifier("training-reminder");

  const id = await Notifications.scheduleNotificationAsync({
    identifier: "training-reminder",
    content: {
      title: "Time to train!",
      body: "Hit the mats today and log your session.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

/**
 * Schedule a daily streak alert at 8pm.
 */
export async function scheduleStreakAlert(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  await cancelByIdentifier("streak-alert");

  const id = await Notifications.scheduleNotificationAsync({
    identifier: "streak-alert",
    content: {
      title: "Don't lose your streak!",
      body: "You haven't logged a session today. Keep your streak alive!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });

  return id;
}

/**
 * Schedule competition reminders: 7 days before and 1 day before.
 * Returns the identifiers of the scheduled notifications.
 */
export async function scheduleCompetitionReminder(
  compName: string,
  compDate: Date
): Promise<string[]> {
  if (Platform.OS === "web") return [];

  const ids: string[] = [];

  const sevenDaysBefore = new Date(compDate);
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
  sevenDaysBefore.setHours(9, 0, 0, 0);

  const oneDayBefore = new Date(compDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(9, 0, 0, 0);

  const now = new Date();

  if (sevenDaysBefore > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Competition in 1 week",
        body: `${compName} is 7 days away. Time to sharpen your game!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: sevenDaysBefore,
      },
    });
    ids.push(id);
  }

  if (oneDayBefore > now) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Competition tomorrow!",
        body: `${compName} is tomorrow. Rest up and get ready!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneDayBefore,
      },
    });
    ids.push(id);
  }

  return ids;
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllScheduled(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancel a specific scheduled notification by identifier.
 */
export async function cancelByIdentifier(identifier: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(identifier);
}
