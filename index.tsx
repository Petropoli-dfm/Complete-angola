import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// O script é carregado no final do <body>, então o elemento #root já existe.
// Podemos renderizar a aplicação diretamente sem esperar por DOMContentLoaded.
const rootElement = document.getElementById('root');
if (!rootElement) {
  // Esta verificação é mantida como uma salvaguarda final.
  throw new Error("Elemento root não encontrado. Verifique o seu index.html.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
