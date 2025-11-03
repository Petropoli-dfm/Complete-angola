// Este service worker é necessário para receber notificações push quando o aplicativo não está em primeiro plano.

// Importa os scripts do Firebase. Use a versão 'compat' para facilitar o uso em service workers.
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// Configuração do Firebase com as chaves corretas fornecidas.
const firebaseConfig = {
  apiKey: "AIzaSyBztAAGBIo7FpfGWtRXORd2CRgf6fzrHlc",
  authDomain: "complete-angola-25f65.firebaseapp.com",
  projectId: "complete-angola-25f65",
  storageBucket: "complete-angola-25f65.firebasestorage.app",
  messagingSenderId: "160253853169",
  appId: "1:160253853169:web:d1e3a83091006910409850"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ",
    payload
  );
  
  // Personaliza a notificação que será exibida para o usuário
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // Adicione um ícone se tiver um na sua pasta pública
    // icon: "/logo192.png", 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});