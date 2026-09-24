import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type NotificationPermissionResult = { supported: boolean; granted: boolean; token?: string };
export async function requestNotificationPermission(): Promise<NotificationPermissionResult> {
 if(Platform.OS==='web') return {supported:false,granted:false};
 const current=await Notifications.getPermissionsAsync();
 const permission=current.granted?current:await Notifications.requestPermissionsAsync();
 if(!permission.granted)return {supported:true,granted:false};
 const token=await Notifications.getExpoPushTokenAsync(); return {supported:true,granted:true,token:token.data};
}
