import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { persistor, store } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import Auth from './Components/Auth';
import AppLayout from './Components/Layout';
import { SocketProvider } from './Components/Providers/SocketProvider';

const App = () => {
  return (
    <Provider store={store}>
      <SocketProvider>
        <PersistGate loading={null} persistor={persistor}>
          <BrowserRouter>
            <Routes>
              <Route path="/chat" element={<AppLayout />} />
              <Route path="/" element={<Auth />} />
            </Routes>
          </BrowserRouter>
        </PersistGate>
      </SocketProvider>
    </Provider >
  );
};

export default App;
