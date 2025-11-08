/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Giống hệt config trong firebase.js
firebase.initializeApp({
  apiKey: "AIzaSyCl3ozeTqJ2uySRVLoZLC3a7-vn8ffTPeg",
  authDomain: "matrupro-c3c0c.firebaseapp.com",
  projectId: "matrupro-c3c0c",
  storageBucket: "matrupro-c3c0c.firebasestorage.app",
  messagingSenderId: "1098250533315",
  appId: "1:1098250533315:web:6ab7bc32da8270e962a576",
  measurementId: "G-CVEPDTXGJ2"
});

const messaging = firebase.messaging();

// Nhận và hiển thị thông báo khi web đang ở background
messaging.onBackgroundMessage((payload) => {
  console.log('📩 [firebase-messaging-sw.js] Received background message ', payload);
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/logo192.png'
  });
});
