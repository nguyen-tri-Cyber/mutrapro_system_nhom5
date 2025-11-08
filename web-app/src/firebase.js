// web-app/src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// ======================================================
// CONFIG HOÀN CHỈNH DỰA TRÊN TẤT CẢ THÔNG TIN CỦA BẠN
const firebaseConfig = {
  apiKey: "AIzaSyCl3ozeTqJ2uySRVLoZLC3a7-vn8ffTPeg", // (Lấy từ file .docx bạn gửi [cite: 6398])
  authDomain: "matrupro-c3c0c.firebaseapp.com", // (Lấy từ file .docx bạn gửi [cite: 6399])
  projectId: "matrupro-c3c0c", // (Lấy từ file .docx bạn gửi [cite: 6400])
  storageBucket: "matrupro-c3c0c.firebasestorage.app", // (Lấy từ file .docx bạn gửi [cite: 6400])
  messagingSenderId: "1098250533315", // (Lấy từ file .docx bạn gửi [cite: 6401])
  appId: "1:1098250533315:web:6ab7bc32da8270e962a576", // (Lấy từ thông tin bạn vừa gửi)
  measurementId: "G-CVEPDTXGJ2" // (Lấy từ file .docx bạn gửi [cite: 6403])
};
// ======================================================

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Hàm để lấy Fcm Token
export const getFcmToken = async () => {
  try {
    // Yêu cầu quyền nhận thông báo từ user
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // !!! ĐÃ DÁN VAPID KEY CỦA BẠN VÀO ĐÂY !!!
      const token = await getToken(messaging, { 
        vapidKey: 'BNIaCdk-f2Mm7H3ao9crBH3iBlxf9KY6EfInFDYcrCkkjFfgAWA8WWpKUG9EROmvV4rbrNQ730LE0pyPAllaNn4' // (Lấy từ thông tin bạn vừa gửi)
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.warn('Notification permission denied.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

// Lắng nghe thông báo khi đang mở web (Tùy chọn)
onMessage(messaging, (payload) => {
  console.log('Message received while app is in foreground. ', payload);
});